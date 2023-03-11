/** @type {import("next").NextConfig} */
module.exports = {
    experimental: {
        externalDir: true,
    },
    i18n: {
		locales: ["en-US"],
		defaultLocale: "en-US",
	},
    images: {
		deviceSizes: [320, 420, 768, 1024, 1200],
		domains: [],
		loader: "default",
	},
    reactStrictMode: true,
	env: {
		WS_ENDPOINT: process.env.WS_ENDPOINT,
	},
};
