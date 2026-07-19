// Extension build (spec 002 R6) — esbuild bundle + static copy.
//
// esbuild bundles the two TypeScript entry points (service worker, content
// script) into dist/, inlining the wasm-pack glue JS. The compiled .wasm binary
// itself is NOT bundled — it is copied into dist/pkg/ as a web_accessible
// resource, and core.ts instantiates it from bytes at runtime (see R5).
//
// Exported (buildOptions, copyStatic, OUT_DIR) so dev.mjs can reuse them for
// watch mode without duplicating the config.

import * as esbuild from "esbuild";
import { rmSync, mkdirSync, cpSync, existsSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const PKG_DIR = join(ROOT, "packages", "core-wasm", "pkg");
export const OUT_DIR = join(HERE, "dist");

export const buildOptions = {
  entryPoints: {
    service_worker: join(HERE, "src", "service_worker.ts"),
    content: join(HERE, "src", "content.ts"),
  },
  outdir: OUT_DIR,
  bundle: true,
  format: "esm",
  target: "chrome120",
  platform: "browser",
  sourcemap: true,
  logLevel: "info",
};

/** Copy the non-bundled assets (manifest, static CSS, quiz page, wasm) into dist/. */
export function copyStatic() {
  if (!existsSync(PKG_DIR)) {
    console.error(
      `! core-wasm pkg not found at ${PKG_DIR}\n` +
        `  Build it first: wasm-pack build packages/core-wasm --target web --release`,
    );
    process.exit(1);
  }
  cpSync(join(HERE, "manifest.json"), join(OUT_DIR, "manifest.json"));
  cpSync(join(HERE, "quiz_gate.html"), join(OUT_DIR, "quiz_gate.html"));
  cpSync(join(HERE, "static"), join(OUT_DIR, "static"), { recursive: true });
  cpSync(PKG_DIR, join(OUT_DIR, "pkg"), { recursive: true });
}

export async function build() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  await esbuild.build(buildOptions);
  copyStatic();
  console.log(`built → ${OUT_DIR}`);
}

// Run build() only when invoked directly (`node build.mjs`), not when imported
// by dev.mjs. realpath comparison is the cross-platform "is this the main module".
const invokedDirectly =
  process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
