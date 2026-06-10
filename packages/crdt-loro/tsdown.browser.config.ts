import { defineConfig } from "tsdown";

export default defineConfig({
    entry: { browser: "src/index.ts" },
    alias: {
        "@loro-runtime": "./src/loro-runtime.browser.ts",
    },
    format: ["esm"],
    target: "esnext",
    sourcemap: true,
    dts: true,
    outDir: "dist",
    clean: true,
});
