const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");

module.exports = {
	theme: {
		colors: {
			...colors
		},
		fontFamily: {
			sans: ["Inter", ...defaultTheme.fontFamily.sans],
			mono: ["Inconsolata", ...defaultTheme.fontFamily.mono],
		},
		keyframes: {
			...defaultTheme.keyframes,
			blink: {
				"0%": { opacity: 1 },
				"50%": { opacity: 0 },
				"100%": { opacity: 1 },
			}
		}
	},
	fontFamily: {
		...defaultTheme.fontFamily,
		sans: ["Inter", ...defaultTheme.fontFamily.sans]
	}
};
