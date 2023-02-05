module.exports = {
	"presets": [
		["next/babel", {
			"preset-react": {
				"runtime": "automatic"
			}
		}]
	],
	"plugins": [
		"macros",
		["styled-components", {
			"ssr": true
		}]
	]
};
