const defaultTheme = require("tailwindcss/defaultTheme");

const zIndices = /** @type {const} */ ([
    "default",
    "extra",
    "footer",
    "app-bar",
    "backdrop",
    "side-drawer",
    "modal",
]);

/** @type {import("tailwindcss").Config} */
module.exports = {
    darkMode: ["class"],
    plugins: [require("tailwindcss-animate")],
    theme: {
        colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
                DEFAULT: "hsl(var(--primary))",
                foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
                DEFAULT: "hsl(var(--secondary))",
                foreground: "hsl(var(--secondary-foreground))",
            },
            destructive: {
                DEFAULT: "hsl(var(--destructive))",
                foreground: "hsl(var(--destructive-foreground))",
            },
            muted: {
                DEFAULT: "hsl(var(--muted))",
                foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
                DEFAULT: "hsl(var(--accent))",
                foreground: "hsl(var(--accent-foreground))",
            },
            popover: {
                DEFAULT: "hsl(var(--popover))",
                foreground: "hsl(var(--popover-foreground))",
            },
            tooltip: {
                DEFAULT: "hsl(var(--tooltip))",
                foreground: "hsl(var(--tooltip-foreground))",
            },
            button: {
                DEFAULT: "hsl(var(--button))",
                foreground: "hsl(var(--button-foreground))",
            },
            card: {
                DEFAULT: "hsl(var(--card))",
                foreground: "hsl(var(--card-foreground))",
            },
        },
        borderRadius: {
            lg: `var(--radius)`,
            md: `calc(var(--radius) - 2px)`,
            sm: "calc(var(--radius) - 4px)",
        },
        fontFamily: {
            sans: ["var(--font-inter)", ...fontFamily.sans],
            mono: ["Inconsolata", ...defaultTheme.fontFamily.mono],
        },
        fontSize: {
            ...defaultTheme.fontSize,
            inherit: ["inherit"],
        },
        keyframes: {
            ...defaultTheme.keyframes,
            "accordion-down": {
                from: { height: 0 },
                to: { height: "var(--radix-accordion-content-height)" },
            },
            "accordion-up": {
                from: { height: "var(--radix-accordion-content-height)" },
                to: { height: 0 },
            },
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
        animation: {
            "accordion-down": "accordion-down 0.2s ease-out",
            "accordion-up": "accordion-up 0.2s ease-out",
        },
        zIndex: zIndices.reduce(
            (acc, zIndex, i) => ({
                ...acc,
                [zIndex]: i,
            }),
            defaultTheme.zIndex,
        ),
    },
};
