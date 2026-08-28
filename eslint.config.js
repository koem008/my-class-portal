import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // These feature adapters currently query tables added by migrations that are
    // not yet represented in the generated Supabase Database type. Keep the rule
    // visible as a warning here until the generated types are refreshed, rather
    // than weakening no-explicit-any for the rest of the application.
    files: [
      "src/lib/art-education-data.ts",
      "src/lib/assistant-memory-data.ts",
      "src/lib/calendar-data.ts",
      "src/lib/class-pseudonyms-data.ts",
      "src/lib/daily-briefing-data.ts",
      "src/lib/lesson-workspace-data.ts",
      "src/lib/onboarding-data.ts",
      "src/lib/schedule-data.ts",
      "src/lib/special-education-data.ts",
      "src/routes/asistentka.tsx",
      "src/routes/index.tsx",
      "src/routes/specialni-pedagogika.$caseId.tsx",
      "src/routes/specialni-pedagogika.tsx",
      "src/routes/vytvarna-vychova.tsx",
      "src/routes/zacatek.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  eslintPluginPrettier,
);
