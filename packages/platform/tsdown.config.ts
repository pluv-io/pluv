import { defineConfig } from "tsdown";

export default defineConfig({
    format: ["esm"],
    dts: true,
    outDir: "dist",
    entry: {
        index: "src/index.ts",
        loadUserFacet: "src/loadUserFacet.ts",
    },
    target: "esnext",
    sourcemap: true,
    clean: true,
});
