import { defineConfig } from "pluv";

export default defineConfig({
    entry: "./src/io.ts",
    port: 8787,
    env: {
        APP_ORIGIN: "http://127.0.0.1:3000",
    },
});
