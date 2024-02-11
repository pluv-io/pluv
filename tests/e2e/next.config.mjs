// @ts-check

/** @type {import("next").NextConfig} */
const config = {
    experimental: {
        externalDir: true,
    },
    reactStrictMode: true,
    webpack: (webpackConfig) => {
        webpackConfig.experiments = {
            layers: true,
            asyncWebAssembly: true,
        };

        return webpackConfig;
    },
};

export default config;
