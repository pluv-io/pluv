import { defineConfig } from "tsdown";

export default defineConfig({
    format: ["esm"],
    dts: true,
    outDir: "dist",
    entry: "src/index.ts",
    target: "esnext",
    sourcemap: true,
    clean: true,
    exports: {
        all: true,
    },
});
