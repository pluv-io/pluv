const config = require("@pluv-internal/tailwind-config");

/** @type {import("tailwindcss").Config} */
module.exports = {
    ...config,
    content: [
        "./src/components/**/*.{js,jsx,ts,tsx}",
        "./src/pages/**/*.{js,jsx,ts,tsx}",
        "../../internal/react-code/src/**/*.{js,jsx,ts,tsx}",
        "../../internal/react-components/src/**/*.{js,jsx,ts,tsx}",
    ],
};
