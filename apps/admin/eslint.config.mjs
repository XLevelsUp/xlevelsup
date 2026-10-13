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
  {
    // No browser-default popups anywhere: feedback goes through the app's own
    // toast, confirmations through an in-app dialog. Toasts are imported from
    // @/lib/toast only, so every one renders through components/ui/Toast.tsx.
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "alert", message: "Use toast from '@/lib/toast' instead of the browser's alert()." },
        { name: "confirm", message: "Use confirmDialog from '@/components/ui/ConfirmDialog' (or DeleteConfirmButton) instead of the browser's confirm()." },
        { name: "prompt", message: "Collect input with a form in a Modal instead of the browser's prompt()." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "alert", message: "Use toast from '@/lib/toast' instead of the browser's alert()." },
        { object: "window", property: "confirm", message: "Use confirmDialog from '@/components/ui/ConfirmDialog' (or DeleteConfirmButton) instead of the browser's confirm()." },
        { object: "window", property: "prompt", message: "Collect input with a form in a Modal instead of the browser's prompt()." },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-hot-toast",
              message: "Import { toast } from '@/lib/toast' — it is the app's single toast entry point.",
            },
          ],
        },
      ],
    },
  },
  {
    // The toast module and its renderer are the only places the engine is used.
    files: ["lib/toast.ts", "components/ToastProvider.tsx", "components/ui/Toast.tsx"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
