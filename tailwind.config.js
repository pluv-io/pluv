const config = require("@pluv-internal/tailwind-config");

/** @type {import("tailwindcss").Config} */
module.exports = {
    ...config,
    content: {
        files: [
            "./apps/storybook/src/**/*.tsx",
            "./apps/www/src/**/*.tsx",
            "./internal/react-chess/**/*.tsx",
            "./internal/react-components/**/*.tsx",
            "./internal/react-code/**/*.tsx",
        ],
    },
};
