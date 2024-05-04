const defaultTheme = require("tailwindcss/defaultTheme");

const zIndices = ["default", "extra", "footer", "app-bar", "backdrop", "side-drawer"];

/** @type {import("tailwindcss").Config} */
module.exports = {
    theme: {
        fontFamily: {
            sans: ["Inter", ...defaultTheme.fontFamily.sans],
            mono: ["Inconsolata", ...defaultTheme.fontFamily.mono],
        },
        fontSize: {
            ...defaultTheme.fontSize,
            inherit: ["inherit"],
        },
        keyframes: {
            ...defaultTheme.keyframes,
            backdropShow: {
                from: { opacity: 0 },
                to: { opacity: 1 },
            },
            blink: {
                "0%": { opacity: 1 },
                "50%": { opacity: 0 },
                "100%": { opacity: 1 },
            },
            rootShow: {
                from: { transform: "translateX(-100%)" },
                to: { transform: "translateX(0)" },
            },
            rootHide: {
                from: { transform: "translateX(0)" },
                to: { transform: "translateX(-100%)" },
            },
        },
        zIndex: zIndices.reduce((acc, name, i) => ({ ...acc, [name]: i }), defaultTheme.zIndex),
    },
    fontFamily: {
        ...defaultTheme.fontFamily,
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
    },
};
