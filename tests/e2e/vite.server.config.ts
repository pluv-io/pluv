import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import tsconfigPaths from "vite-tsconfig-paths";

// loro-crdt's bundler entry uses top-level await and .wasm imports; these plugins
// are required when running the loro server via vite-node instead of loro-crdt/nodejs.
export default defineConfig({
    plugins: [
        wasm(),
        topLevelAwait(),
        tsconfigPaths({ projects: ["./src/server/tsconfig.json"] }),
    ],
    ssr: {
        external: ["better-sqlite3", "ws", "ioredis"],
        noExternal: [],
    },
    resolve: {
        conditions: ["import", "module", "browser", "default"],
    },
});
