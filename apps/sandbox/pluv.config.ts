import { defineConfig } from "pluv";

export default defineConfig({
    entry: "./src/io.ts",
    port: 8787,
    env: {
        APP_ORIGIN: "http://127.0.0.1:3000",
    },
    "~": {
        apiUrl: "http://localhost:8880",
        appUrl: "http://localhost:3000",
        authUrl: "http://localhost:8789",
    },
});
