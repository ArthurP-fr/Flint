import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // =========================
  // IGNORE GLOBAL
  // =========================
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
    ],
  },

  // =========================
  // BASE JS RULES
  // =========================
  js.configs.recommended,

  // =========================
  // TYPESCRIPT SUPPORT
  // =========================
  ...tseslint.configs.recommended,

  // =========================
  // NODE (API / BOT / SCRIPTS / SHARED)
  // =========================
  {
    files: [
      "apps/api/**/*.{js,mjs,ts}",
      "apps/bot/**/*.{js,mjs,ts}",
      "scripts/**/*.{js,mjs,ts}",
      "packages/shared/**/*.{js,ts}",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },

  // =========================
  // WEB (NEXT.JS)
  // =========================
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },

  // =========================
  // COMMONJS FILES (.cjs)
  // =========================
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
  },

  // =========================
  // LEGACY BOT (réduit le bruit)
  // =========================
  {
    files: ["apps/bot/src/legacy/**"],
    rules: {
      "no-unused-vars": "warn",
    },
  },
];
