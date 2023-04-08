import commonjs from "@rollup/plugin-commonjs";
import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import nodeGlobals from "rollup-plugin-node-globals";
import nodePolyfills from "rollup-plugin-node-polyfills";

/** @type {import("rollup").RollupOptions} */
const config = {
    input: "./src/index.ts",
    output: {
        dir: "./dist",
        format: "esm",
    },
    plugins: [
        typescript({
            allowSyntheticDefaultImports: true,
        }),
        // Converts CommonJS modules to ES6.
        commonjs({
            transformMixedEsModules: true,
        }),
        // Resolves JSON files as objects.
        json(),
        // Resolves NPM packages from node_modules/.
        nodeResolve({
            browser: true,
        }),
        // Polyfills NodeJS APIs, when possible.
        nodePolyfills({
            crypto: true,
        }),
        // Polyfills NodeJS global variables (e.g. process).
        // NOTE: Can be removed, especially if you're running into
        // weird complication errors from some of your dependencies.
        nodeGlobals(),
        // Resolves non-toplevel imports using static analysis.
        dynamicImportVars({
            warnOnError: true,
        }),
        terser({
            module: true,
        }),
    ],
};

export default config;
