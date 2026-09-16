import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          // `linedItems.map(({ lineTotal, ...item }) => item)` is how this
          // codebase drops a computed field before an insert. The binding is
          // the mechanism, not dead code — deleting it would put the column
          // back into the payload.
          ignoreRestSiblings: true,
          // Leading underscore marks something deliberately unused but load
          // bearing: a prop or parameter that is part of a signature callers
          // already satisfy, which cannot be removed without touching them.
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // scripts/*.js are plain CommonJS, run directly with `node`. require() is
    // the correct construct there, not a legacy import style to migrate off —
    // the rule is aimed at ES-module TypeScript, which those files are not.
    // The .ts scripts alongside them are still held to the rule.
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
