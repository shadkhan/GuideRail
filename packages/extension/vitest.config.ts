import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.ts"],
    // Run test files sequentially: core.test.ts and service_worker.test.ts each
    // instantiate the 214KB WASM module, and compiling both concurrently
    // contends enough on modest hardware to trip the default hook timeout.
    // Sequential total is only ~8s, so this costs little and is deterministic.
    fileParallelism: false,
  },
});
