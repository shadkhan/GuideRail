// Extension dev loop (spec 002 R6) — esbuild watch + web-ext hot reload.
//
//   pnpm ext:dev              build once, watch, load unpacked, reload on change
//   pnpm ext:dev --reset-storage   same, but start from a clean browser profile
//                                  (the stale-pack gotcha: a cached pack in
//                                   chrome.storage can mask a schema change)
//
// esbuild --watch rebuilds dist/ on any src change; web-ext watches dist/ and
// reloads the extension in the browser. The two run concurrently.
//
// Caveat (L-008): current stable Chrome disables the --load-extension switch, so
// `web-ext run --target chromium` may not load the unpacked extension on this
// machine. We pass --disable-features=DisableLoadExtensionCommandLineSwitch to
// try to re-enable it; if the browser still refuses, load dist/ manually via
// chrome://extensions (Developer mode → Load unpacked). The build/watch half of
// this loop is unaffected.

import * as esbuild from "esbuild";
import { spawn } from "node:child_process";
import { rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildOptions, copyStatic, OUT_DIR, build } from "./build.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const resetStorage = process.argv.includes("--reset-storage");
const PROFILE_DIR = join(HERE, ".web-ext-chromium-profile");

async function main() {
  // Fresh full build first (also validates pkg/ exists).
  await build();

  // Re-copy static assets after each incremental rebuild so manifest/pkg edits
  // propagate to dist without a manual restart.
  const ctx = await esbuild.context({
    ...buildOptions,
    plugins: [
      {
        name: "copy-static",
        setup(b) {
          b.onEnd(() => copyStatic());
        },
      },
    ],
  });
  await ctx.watch();
  console.log("· esbuild watching src/…");

  if (resetStorage && existsSync(PROFILE_DIR)) {
    rmSync(PROFILE_DIR, { recursive: true, force: true });
    console.log("· --reset-storage: cleared dev browser profile");
  }

  // web-ext loads the unpacked build and reloads it on dist/ changes. Keeping a
  // persistent profile (unless --reset-storage) preserves earned-time/token
  // state between reloads, which is closer to real usage.
  const webExtArgs = [
    "web-ext",
    "run",
    "--target=chromium",
    `--source-dir=${OUT_DIR}`,
    "--keep-profile-changes",
    `--chromium-profile=${PROFILE_DIR}`,
    "--args=--disable-features=DisableLoadExtensionCommandLineSwitch",
  ];
  const child = spawn(`npx ${webExtArgs.join(" ")}`, {
    cwd: HERE,
    stdio: "inherit",
    shell: true,
  });

  const shutdown = () => {
    child.kill();
    ctx.dispose();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  child.on("exit", (code) => {
    ctx.dispose();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
