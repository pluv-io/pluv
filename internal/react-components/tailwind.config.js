const config = require("@pluv-internal/tailwind-config");

/** @type {import("tailwindcss").Config} */
module.exports = {
    ...config,
    content: ["./client/**/*.{js,jsx,ts,tsx}", "./either/**/*.{js,jsx,ts,tsx}", "./server/**/*.{js,jsx,ts,tsx}"],
};
