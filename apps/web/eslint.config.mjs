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
    // No browser-default popups anywhere: feedback goes through the app's own
    // toast, confirmations through an in-app dialog. Toasts are imported from
    // @/lib/toast only, so every one renders through components/ui/Toast.tsx.
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "alert", message: "Use toast from '@/lib/toast' instead of the browser's alert()." },
        { name: "confirm", message: "Use an in-app confirmation dialog instead of the browser's confirm()." },
        { name: "prompt", message: "Collect input with a form in a Modal instead of the browser's prompt()." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "alert", message: "Use toast from '@/lib/toast' instead of the browser's alert()." },
        { object: "window", property: "confirm", message: "Use an in-app confirmation dialog instead of the browser's confirm()." },
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
