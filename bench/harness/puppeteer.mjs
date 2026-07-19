// Puppeteer benchmark harness — spec 001 (WASM Core Spike).
//
// Why real Chrome, not Node? Per the wasm-build skill: Node's V8 flatters
// WASM performance by ~30% vs a real service worker. A benchmark that passes
// in Node but fails in the browser is a lie. So we drive an actual Chrome
// instance and measure INSIDE a real service worker where classify() runs.
//
// Substrate: the classifier is exercised in a real Chrome *module
// ServiceWorker*, registered from bench/harness/fixture/index.html served
// over a local static server — NOT an MV3 (Manifest V3) extension worker.
// Current stable Chrome (2026) blocks the --load-extension command-line
// switch, so puppeteer can't load an unpacked extension. It doesn't matter
// for what we measure: fixture/sw.js uses zero chrome.* APIs, so the WASM
// path (V8 engine, worker-thread scheduling, fetch-then-instantiate cold
// start) is identical to an extension SW. See ADR-0003. Re-running on a real
// extension SW is a follow-up for when a compatible loading route exists.
//
// Two paths, two budgets (both must pass):
//   COLD  worker spawn -> WASM instantiate -> first classify().  < 50 ms
//   WARM  steady-state classify() with the module live (p95).    <  5 ms
//   SIZE  gzipped .wasm.                                         < 200 KB
//
// Cold is sampled by registering a fresh worker (cache-busted URL) N times;
// the very first classify on each fresh worker IS the cold path — no
// artificial 30 s idle-kill wait needed. Warm runs 1000 classifies on the
// live worker.
//
// Does NOT write bench/results/baseline.json — the PreToolUse hook blocks
// unapproved writes. Updating the baseline is a reviewed act (see bench/README).

import { execSync, spawnSync } from "node:child_process";
import { readFileSync, cpSync, rmSync, existsSync, readdirSync, appendFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, extname } from "node:path";
import os from "node:os";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const corePkg = join(repoRoot, "packages", "core-wasm", "pkg");
const fixtureDir = join(__dirname, "fixture");
const fixturePkg = join(fixtureDir, "pkg");
const historyCsv = join(repoRoot, "bench", "results", "history.csv");

const PACK = "core-study-v1";
// A realistic ~study-page chunk: prose with several curriculum keywords so
// the automaton has real work (matches to collect), not a trivial no-match.
const TEXT = (
  "Today's lesson covers algebra and basic geometry. We solved a linear " +
  "equation, then reduced a fraction to lowest terms. In science class the " +
  "topic was photosynthesis inside the mitochondria of a plant cell, and how " +
  "an ecosystem recycles energy. For language work, revise the grammar of " +
  "each paragraph and note new vocabulary. History: the causes of the " +
  "revolution and the rise of an early civilization. "
).repeat(3);

const N_WARM = 1000;
const N_COLD_SAMPLES = 5;

const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WASM_PACK = process.env.WASM_PACK || "wasm-pack";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".json": "application/json; charset=utf-8",
};

function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return NaN;
  const idx = Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1);
  return sortedAsc[idx];
}

function buildWasm() {
  console.log("· building WASM (wasm-pack --target web --release)…");
  const res = spawnSync(
    WASM_PACK,
    ["build", join(repoRoot, "packages", "core-wasm"), "--target", "web", "--release"],
    { stdio: "inherit", env: { ...process.env, CARGO_HTTP_CHECK_REVOKE: "false" }, shell: false },
  );
  if (res.status !== 0) {
    if (existsSync(corePkg)) {
      console.warn("! wasm-pack failed but packages/core-wasm/pkg exists — using it.");
    } else {
      throw new Error("wasm-pack build failed and no prebuilt pkg/ to fall back to.");
    }
  }
}

// wasm-pack's built-in wasm-opt is disabled (it fetches binaryen from GitHub,
// which the build network blocks — see Cargo.toml). Instead we run wasm-opt
// from the npm `binaryen` package (installed from the npm registry) as an
// explicit post-step, so the release .wasm is size- and compile-optimized
// reproducibly and offline.
function optimizeWasm() {
  const wasmFile = readdirSync(corePkg).find((f) => f.endsWith("_bg.wasm"));
  if (!wasmFile) throw new Error("no *_bg.wasm to optimize");
  const wasmPath = join(corePkg, wasmFile);
  const bin =
    process.env.WASM_OPT || join(repoRoot, "node_modules", ".bin", "wasm-opt");
  // Single command string (not args + shell:true) to avoid Node's DEP0190
  // warning; the .bin shim needs a shell to resolve on Windows.
  const res = spawnSync(`"${bin}" -Os "${wasmPath}" -o "${wasmPath}"`, {
    stdio: "inherit",
    shell: true,
  });
  if (res.status !== 0) {
    console.warn("! wasm-opt failed — proceeding with the unoptimized .wasm");
  } else {
    console.log("· wasm-opt -Os applied");
  }
}

function syncFixturePkg() {
  rmSync(fixturePkg, { recursive: true, force: true });
  cpSync(corePkg, fixturePkg, { recursive: true });
}

function gzippedWasmKb() {
  const wasm = readdirSync(corePkg).find((f) => f.endsWith("_bg.wasm"));
  if (!wasm) throw new Error("no *_bg.wasm in pkg/");
  const bytes = gzipSync(readFileSync(join(corePkg, wasm))).length;
  return bytes / 1024;
}

// Minimal static server for the fixture dir. Strips the query string so the
// cache-busted "sw.js?v=N" resolves to sw.js on disk.
function startServer() {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const rel = urlPath === "/" ? "/index.html" : urlPath;
    const filePath = join(fixtureDir, rel);
    if (!filePath.startsWith(fixtureDir) || !existsSync(filePath)) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    // The registration script must always be fresh; the wasm/pkg files should
    // be HTTP-cacheable so cold samples after the first instantiate from
    // cached bytes — modelling production's chrome.storage.local byte cache
    // rather than re-downloading each time.
    const isSw = rel === "/sw.js";
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath)] || "application/octet-stream",
      "Cache-Control": isSw ? "no-store" : "public, max-age=31536000",
    });
    res.end(readFileSync(filePath));
  });
  return new Promise((ready) => server.listen(0, "127.0.0.1", () => ready(server)));
}

async function waitForBench(worker) {
  for (let i = 0; i < 200; i++) {
    const ok = await worker.evaluate(() => typeof self.__bench !== "undefined").catch(() => false);
    if (ok) {
      await worker.evaluate(() => self.__bench.ready());
      return worker;
    }
    await sleep(25);
  }
  throw new Error("fixture __bench never appeared in the service worker");
}

// Resolve with the next newly-created service-worker target whose URL contains
// `match`. Times out so a missed event can't hang the run.
function nextServiceWorkerTarget(browser, match, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      browser.off("targetcreated", handler);
      reject(new Error("timed out waiting for a new service_worker target"));
    }, timeoutMs);
    const handler = (t) => {
      if (t.type() === "service_worker" && t.url().includes(match)) {
        clearTimeout(timer);
        browser.off("targetcreated", handler);
        resolve(t);
      }
    };
    browser.on("targetcreated", handler);
  });
}

// Register a fresh worker, attach to it once __bench is live. The SW script
// URL is cache-busted (?v=N) so each registration reliably spawns a NEW worker
// that re-instantiates the WASM. Crucially, the WASM module URL inside sw.js is
// unchanged, so Chrome serves its compiled bytes from the code cache after the
// first compile — the same path an idle-killed MV3 worker takes when it wakes
// in production. So version 0 is the genuine first-ever (uncached) compile;
// versions ≥1 are code-cached cold restarts.
async function registerFreshWorker(browser, page, version) {
  const created = nextServiceWorkerTarget(browser, `sw.js?v=${version}`);
  await page.evaluate(async (v) => {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    await navigator.serviceWorker.register(`./sw.js?v=${v}`, { type: "module" });
    await navigator.serviceWorker.ready;
  }, version);
  const target = await created;
  return waitForBench(await target.worker());
}

async function main() {
  buildWasm();
  optimizeWasm();
  syncFixturePkg();
  const gzKb = gzippedWasmKb();

  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-first-run", "--no-default-browser-check"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`${origin}/index.html`, { waitUntil: "domcontentloaded" });

    // First install (version 0): the genuine first-ever compile (no code cache
    // yet). Reported separately — it is NOT the production idle-wake cold path.
    let worker = await registerFreshWorker(browser, page, 0);
    const install = await worker.evaluate((t, p) => self.__bench.cold(t, p), TEXT, PACK);
    console.log(
      `· first install (uncached compile): instantiate ${install.coldReadyMs.toFixed(2)}ms + ` +
        `first classify ${install.firstClassifyMs.toFixed(2)}ms = ${install.totalMs.toFixed(2)}ms`,
    );

    // COLD (production path): fresh workers 1..N, WASM served from the code
    // cache, measured on each worker's first classify.
    const coldSamples = [];
    for (let i = 1; i <= N_COLD_SAMPLES; i++) {
      worker = await registerFreshWorker(browser, page, i);
      const c = await worker.evaluate((t, p) => self.__bench.cold(t, p), TEXT, PACK);
      coldSamples.push(c.totalMs);
    }
    console.log(`· cold restarts (code-cached): ${coldSamples.map((x) => x.toFixed(1)).join(", ")} ms`);

    // WARM: 1000 classifies on the last live worker.
    const warm = await worker.evaluate(
      (n, t, p) => self.__bench.warm(n, t, p),
      N_WARM,
      TEXT,
      PACK,
    );

    const warmSorted = warm.slice().sort((a, b) => a - b);
    const coldSorted = coldSamples.slice().sort((a, b) => a - b);

    const metrics = {
      gzKb,
      coldP50: percentile(coldSorted, 50),
      warmP50: percentile(warmSorted, 50),
      warmP95: percentile(warmSorted, 95),
      warmP99: percentile(warmSorted, 99),
      corpusSize: TEXT.length,
    };

    report(metrics, coldSamples);
    appendHistory(metrics);
    process.exitCode = budgetsPass(metrics) ? 0 : 1;
  } finally {
    await browser.close();
    server.close();
  }
}

function budgetsPass(m) {
  return m.warmP95 < 5 && m.coldP50 < 50 && m.gzKb < 200;
}

function report(m, coldSamples) {
  const ok = (b) => (b ? "PASS" : "FAIL");
  console.log("\n=== GuideRail WASM core benchmark (real Chrome ServiceWorker) ===");
  console.log(`  gzipped .wasm : ${m.gzKb.toFixed(1)} KB   [${ok(m.gzKb < 200)}  budget <200KB]`);
  console.log(
    `  cold p50      : ${m.coldP50.toFixed(2)} ms  [${ok(m.coldP50 < 50)}  budget <50ms]  ` +
      `(samples: ${coldSamples.map((x) => x.toFixed(1)).join(", ")})`,
  );
  console.log(`  warm p50      : ${m.warmP50.toFixed(3)} ms`);
  console.log(`  warm p95      : ${m.warmP95.toFixed(3)} ms  [${ok(m.warmP95 < 5)}  budget <5ms]`);
  console.log(`  warm p99      : ${m.warmP99.toFixed(3)} ms`);
  console.log(`  corpus size   : ${m.corpusSize} chars, ${N_WARM} warm iterations\n`);
}

function gitSha() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: repoRoot }).toString().trim();
  } catch {
    return "uncommitted";
  }
}

function appendHistory(m) {
  const hardware = `${os.platform()}-${os.arch()} ${os.cpus()[0].model}`.replace(/,/g, " ");
  const row = [
    new Date().toISOString(),
    gitSha(),
    m.gzKb.toFixed(1),
    m.coldP50.toFixed(2),
    m.warmP50.toFixed(3),
    m.warmP95.toFixed(3),
    m.warmP99.toFixed(3),
    m.corpusSize,
    hardware,
  ].join(",");
  appendFileSync(historyCsv, row + "\n");
  console.log(`· appended row to ${historyCsv}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
