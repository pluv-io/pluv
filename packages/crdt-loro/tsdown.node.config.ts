import { defineConfig } from "tsdown";

export default defineConfig({
    entry: { node: "src/index.ts" },
    plugins: [
        {
            name: "rewrite-loro-import",
            renderChunk(code) {
                return {
                    code: code.replaceAll(/from\s*["']loro-crdt["']/g, 'from "loro-crdt/nodejs"'),
                    map: null,
                };
            },
        },
    ],
    format: ["esm"],
    target: "esnext",
    sourcemap: true,
    tsconfig: "tsconfig.node.build.json",
    dts: false,
    outDir: "dist",
    clean: false,
});
