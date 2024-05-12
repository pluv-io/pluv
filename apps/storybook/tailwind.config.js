const config = require("@pluv-internal/tailwind-config");

/** @type {import("tailwindcss").Config} */
module.exports = {
    ...config,
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "../web/src/**/*.{js,jsx,ts,tsx}",
        "../../internal/react-code/src/**/*.{js,jsx,ts,tsx}",
        "../../internal/react-components/src/**/*.{js,jsx,ts,tsx}",
    ],
};
