import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import onlyWarn from "eslint-plugin-only-warn";
import eslintPluginPrettier from "eslint-plugin-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tsEslint from "typescript-eslint";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tsEslint.configs.recommended,
  {
    plugins: { turbo: turboPlugin },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  { plugins: { onlyWarn } },
  {
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      "prettier/prettier": ["warn", { printWidth: 120, tabWidth: 4 }],
    },
  },
  { ignores: ["dist/**"] },
];
