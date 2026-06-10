import { defineConfig } from "tsdown";

export default defineConfig({
    entry: { node: "src/index.ts" },
    alias: {
        "@loro-runtime": "./src/loro-runtime.node.ts",
    },
    format: ["esm"],
    target: "esnext",
    sourcemap: true,
    tsconfig: "tsconfig.node.build.json",
    dts: false,
    outDir: "dist",
    clean: false,
});
