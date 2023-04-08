/** @type {import("eslint").Linter.Config} */
module.exports = {
    extends: [
        "next",
        "turbo",
        "plugin:prettier/recommended",
        "plugin:tailwindcss/recommended",
        "prettier",
    ],
    parserOptions: {
        babelOptions: {
            presets: [require.resolve("next/babel")],
        },
    },
    plugins: ["prettier", "tailwindcss"],
    rules: {
        "@next/next/no-html-link-for-pages": "off",
        "prettier/prettier": [
            "warn",
            {
                tabWidth: 4,
            },
        ],
        "react/jsx-key": "off",
        "react/self-closing-comp": [
            "warn",
            {
                component: true,
                html: true,
            },
        ],
    },
    settings: {
        tailwindcss: {
            config: "./tailwindcss.config.js",
        },
    },
};
