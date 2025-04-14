import { defineConfig } from "tsup";

export default defineConfig({
    dts: true,
    entry: ["src/index.ts"],
    external: ["cloudflare:workers"],
    format: ["cjs", "esm"],
});
