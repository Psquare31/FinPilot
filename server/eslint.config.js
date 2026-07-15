import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

// The `lint` script has existed since the project was scaffolded but no config
// file was ever added, so `eslint .` failed with "couldn't find an
// eslint.config file" on every invocation.
export default defineConfig([
  globalIgnores(["coverage", "node_modules", "bench/results"]),

  {
    files: ["**/*.js", "**/*.mjs"],

    extends: [js.configs.recommended],

    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },

    rules: {
      // Unused function arguments are common in Express error middleware,
      // whose 4-arity signature is what marks it as an error handler.
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  {
    files: ["src/tests/**/*.js", "**/*.test.js"],

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
]);
