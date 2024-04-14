import commonjs from "@rollup/plugin-commonjs";
import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "node:path";
import { OutputAsset, OutputChunk, Plugin, rollup } from "rollup";
import nodePolyfills from "rollup-plugin-node-polyfills";
import { resolveDependenciesTransformer } from "./resolveDependenciesTransformer.js";

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

const getEnv = (
    env: Record<string, string> | string = path.resolve(
        process.cwd(),
        "./.env",
    ),
): Record<string, string> => {
    if (typeof env !== "string") return env;

    try {
        return dotenv.config({ path: env }).parsed ?? {};
    } catch {
        return {};
    }
};

export interface BuildAppOptions {
    env?: Record<string, string> | string;
    input: string;
    outDir: string;
}

export const buildApp = async (options: BuildAppOptions) => {
    const { env, input, outDir: _outDir } = options;

    const outDir = path.resolve(process.cwd(), options.outDir);
    const outFile = path.resolve(outDir, "./index.js");

    const replaceEnv = Object.entries(getEnv(env)).reduce<
        Record<string, string>
    >(
        (acc, [key, value]) => ({
            ...acc,
            [`process.env.${key}`]: JSON.stringify(value),
        }),
        {},
    );

    const bundle = await rollup({
        input,
        output: { format: "esm", file: outFile },
        onLog: (level, log) => {
            const { frame, loc, message } = log;

            if (loc) {
                console.warn(
                    `${message}`
                        .replace(/\s*\[plugin\s+\w+\]\s*/gi, "")
                        .replace(/\s*@rollup\/plugin\S+\s*/gi, "")
                        .replace(/\s*rollup\S+\s*/gi, ""),
                );
                if (frame) console.warn(frame);
            } else {
                console.warn(log);
            }
        },
        plugins: [
            (replace as unknown as typeof replace.default)({
                preventAssignment: true,
                values: replaceEnv,
            }),
            (typescript as unknown as typeof typescript.default)({
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
                transformers: { before: [resolveDependenciesTransformer] },
                include: input,
            }),
            // Converts CommonJS modules to ES6.
            (commonjs as unknown as typeof commonjs.default)({
                transformMixedEsModules: true,
            }),
            // Resolves JSON files as objects.
            (json as unknown as typeof json.default)(),
            // Resolves NPM packages from node_modules/.
            nodeResolve({
                browser: true,
            }),
            // Polyfills NodeJS APIs, when possible.
            (nodePolyfills as unknown as typeof nodePolyfills.default)({
                crypto: true,
            }) as Plugin,
            // Resolves non-toplevel imports using static analysis.
            (dynamicImportVars as unknown as typeof dynamicImportVars.default)({
                warnOnError: true,
            }),
            (terser as unknown as typeof terser.default)({
                module: true,
            }),
        ],
    });

    const { output } = await bundle.generate({
        file: outFile,
        format: "esm",
    });

    if (!isOutputValid(output)) {
        throw new Error("input requires a default export");
    }

    fs.ensureDirSync(outDir);

    output.forEach((chunk) => saveChunk(outDir, chunk));

    await bundle.close();
};
