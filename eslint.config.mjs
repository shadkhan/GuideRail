// Flat ESLint config (ESLint 9 / typescript-eslint 8). Replaces the legacy
// .eslintrc.cjs, which ESLint 9 no longer reads. Shared across all TS packages
// (spec 002 R1). Lints TypeScript source only; build scripts (*.mjs) and
// generated output (dist/pkg/target) are ignored.

import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/pkg/**",
      "**/target/**",
      "**/node_modules/**",
      "**/*.mjs",
      "**/*.cjs",
      "**/*.js",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      // TypeScript already checks references; ESLint's no-undef would false-flag
      // browser/webextension globals (chrome, performance, fetch, …).
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
