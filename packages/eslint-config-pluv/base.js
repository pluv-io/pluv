import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import onlyWarn from "eslint-plugin-only-warn";
import eslintPluginPrettier from "eslint-plugin-prettier";
import turboPlugin from "eslint-plugin-turbo";

export const overrides = {
    rules: {
        "no-extra-boolean-cast": "off",
    },
};

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
    js.configs.recommended,
    eslintConfigPrettier,
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
            "prettier/prettier": ["warn", { printWidth: 100, tabWidth: 4 }],
        },
    },
    overrides,
    { ignores: ["dist/**"] },
];
