const config = require("@pluv-internal/tailwind-config");

/** @type {import("tailwindcss").Config} */
module.exports = {
    ...config,
    content: [
        "./src/components/**/*.{js,jsx,ts,tsx}",
        "./src/app/**/*.{js,jsx,ts,tsx}",
        "./src/pages/**/*.{js,jsx,ts,tsx}",
        "../../internal/mdx-components/src/**/*.{js,jsx,ts,tsx}",
        "../../internal/react-components/client/**/*.{js,jsx,ts,tsx}",
        "../../internal/react-components/either/**/*.{js,jsx,ts,tsx}",
        "../../internal/react-components/server/**/*.{js,jsx,ts,tsx}",
    ],
};
