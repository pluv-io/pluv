import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsconfigPaths({ projects: ["./src/server/tsconfig.json"] })],
    ssr: {
        external: ["better-sqlite3", "ws", "ioredis"],
        resolve: {
            conditions: ["node", "import", "default"],
        },
    },
});
