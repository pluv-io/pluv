// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

        webpackConfig.resolve ??= {};
        webpackConfig.resolve.alias = {
            ...webpackConfig.resolve.alias,
            "@pluv/crdt-loro": path.resolve(__dirname, "../../packages/crdt-loro/dist/browser.mjs"),
        };

        return webpackConfig;
    },
};

export default config;
