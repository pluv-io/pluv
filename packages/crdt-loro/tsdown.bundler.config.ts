import { defineConfig } from "tsdown";

export default defineConfig({
    entry: { bundler: "src/index.ts" },
    alias: {
        "@loro-runtime": "./src/loro-runtime.bundler.ts",
    },
    format: ["esm"],
    target: "esnext",
    sourcemap: true,
    tsconfig: "tsconfig.bundler.build.json",
    dts: false,
    outDir: "dist",
    clean: false,
});
