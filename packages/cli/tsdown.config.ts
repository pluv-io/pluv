import { defineConfig } from "tsdown";

export default defineConfig({
    format: ["esm"],
    dts: true,
    outDir: "dist",
    entry: {
        config: "src/defineConfig.ts",
        cli: "src/cli.tsx",
        "commands/_app": "src/commands/_app.tsx",
        "commands/dev": "src/commands/dev.tsx",
        supervisor: "src/room/supervisor.ts",
        facet: "src/room/facet.ts",
        bundle: "src/bundle.ts",
    },
    // Pastel loads commands from dist/commands and only accepts .js, .jsx, .ts, and .tsx.
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
    target: "esnext",
    copy: [{ from: "src/command/dev/worker.ts", to: "dist/dev" }],
    sourcemap: true,
    clean: true,
    deps: {
        neverBundle: ["cloudflare:workers", "server.js"],
    },
});
