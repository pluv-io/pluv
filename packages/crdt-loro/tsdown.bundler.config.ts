import { defineConfig } from "tsdown";

export default defineConfig({
    entry: { bundler: "src/index.ts" },
    plugins: [
        {
            name: "rewrite-loro-import",
            renderChunk(code) {
                return {
                    code: code.replaceAll(/from\s*["']loro-crdt["']/g, 'from "loro-crdt/bundler"'),
                    map: null,
                };
            },
        },
    ],
    format: ["esm"],
    target: "esnext",
    sourcemap: true,
    tsconfig: "tsconfig.bundler.build.json",
    dts: false,
    outDir: "dist",
    clean: false,
});
