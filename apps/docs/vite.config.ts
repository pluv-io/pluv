import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import mdx from "fumadocs-mdx/vite";
import { defineConfig } from "vite";

export default defineConfig({
    server: {
        port: 3000,
    },
    resolve: {
        tsconfigPaths: true,
        alias: {
            tslib: "tslib/tslib.es6.js",
        },
    },
    plugins: [
        mdx(),
        tailwindcss(),
        cloudflare({ viteEnvironment: { name: "ssr" } }),
        tanstackStart({
            prerender: {
                enabled: true,
            },
        }),
        react(),
    ],
});
