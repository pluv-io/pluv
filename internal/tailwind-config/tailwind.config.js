const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");

module.exports = {
	theme: {
		colors: {
			...colors
		}
	},
	fontFamily: {
		...defaultTheme.fontFamily,
		sans: ["Inter", ...defaultTheme.fontFamily.sans]
	}
};
