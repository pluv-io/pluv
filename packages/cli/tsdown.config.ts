import { defineConfig } from "tsdown";

export default defineConfig({
    format: ["esm"],
    dts: true,
    outDir: "dist",
    entry: {
        config: "src/defineConfig.ts",
        cli: "src/cli.tsx",
        program: "src/program.tsx",
        supervisor: "src/room/supervisor.ts",
        facet: "src/room/facet.ts",
        bundle: "src/bundle.ts",
    },
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
    target: "esnext",
    copy: [{ from: "src/commands/dev/worker.ts", to: "dist/dev" }],
    sourcemap: true,
    clean: true,
    deps: {
        neverBundle: [
            "@effect/platform-node",
            "@opentui/core",
            "@opentui/react",
            "cloudflare:workers",
            "effect",
            "server.js",
        ],
    },
});
