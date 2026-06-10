import { defineConfig } from "vite";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    ssr: {
        external: ["better-sqlite3", "ws", "ioredis"],
        resolve: {
            conditions: ["node", "import", "default"],
        },
    },
});
