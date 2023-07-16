import commonjs from "@rollup/plugin-commonjs";
import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import fs from "fs-extra";
import path from "path";
import { OutputAsset, OutputChunk, Plugin, rollup } from "rollup";
import nodePolyfills from "rollup-plugin-node-polyfills";

const isOutputValid = (chunks: (OutputChunk | OutputAsset)[]): boolean => {
    return chunks.some((chunk) => {
        if (chunk.type !== "chunk") return false;
        if (chunk.fileName !== "index.js") return false;

        return chunk.exports.includes("default");
    });
};

const saveChunk = (outDir: string, chunk: OutputChunk | OutputAsset) => {
    if (chunk.type !== "chunk") return;

    const outFile = path.resolve(outDir, chunk.fileName);

    fs.writeFileSync(outFile, chunk.code, { encoding: "utf-8" });
};

export interface BuildAppOptions {
    input: string;
    outDir: string;
}

export const buildApp = async (options: BuildAppOptions) => {
    const bundle = await rollup({
        input: options.input,
        output: { format: "esm" },
        plugins: [
            (typescript as any)({
                allowJs: true,
                allowSyntheticDefaultImports: true,
                checkJs: false,
                esModuleInterop: true,
                forceConsistentCasingInFileNames: true,
                incremental: false,
                inlineSources: false,
                isolatedModules: true,
                jsx: "preserve",
                lib: ["es2021"],
                module: "esnext",
                moduleResolution: "node",
                noEmit: true,
                noUnusedLocals: false,
                noUnusedParameters: false,
                preserveWatchOutput: true,
                resolveJsonModule: true,
                skipLibCheck: true,
                strict: true,
                target: "es2021",
            }),
            // Converts CommonJS modules to ES6.
            (commonjs as any)({
                transformMixedEsModules: true,
            }),
            // Resolves JSON files as objects.
            (json as any)(),
            // Resolves NPM packages from node_modules/.
            (nodeResolve as any)({
                browser: true,
            }),
            // Polyfills NodeJS APIs, when possible.
            (nodePolyfills as any)({
                crypto: true,
            }) as Plugin,
            // Resolves non-toplevel imports using static analysis.
            (dynamicImportVars as any)({
                warnOnError: true,
            }),
            (terser as any)({
                module: true,
            }),
        ],
    });

    const outDir = path.resolve(process.cwd(), options.outDir);

    const { output } = await bundle.generate({
        file: path.resolve(outDir, "./index.js"),
        format: "esm",
    });

    if (!isOutputValid(output)) {
        throw new Error("input requires a default export");
    }

    fs.ensureDirSync(outDir);

    output.forEach((chunk) => saveChunk(outDir, chunk));

    await bundle.close();
};
