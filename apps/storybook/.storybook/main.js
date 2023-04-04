const path = require("path");

module.exports = {
    stories: [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    addons: [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
    ],
    framework: {
        name: "@storybook/nextjs",
        options: {
            nextConfigPath: path.resolve(__dirname, "../next.config.mjs"),
        },
    },
    staticDirs: ["../public"],
    webpackFinal: async (config) => {
        config.resolve.fallback = {
            crypto: require.resolve("crypto-browserify"),
            path: require.resolve("path-browserify"),
            stream: require.resolve("stream-browserify"),
            url: require.resolve("url/"),
        };

        return config;
    },
};
