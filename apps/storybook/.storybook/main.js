const path = require("path");

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
    stories: [path.join(__dirname, "../src/**/*.stories.@(js|jsx|ts|tsx)")],
    addons: [
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
        "@storybook/addon-themes",
    ],
    framework: "@storybook/nextjs",
    docs: {
        autodocs: "tag",
    },
    staticDirs: ["../public"],
};

export default config;
