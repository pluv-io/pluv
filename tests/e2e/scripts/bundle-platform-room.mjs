import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..");
const outdir = resolve(packageRoot, "src/server/yjs/platform/generated");

await mkdir(outdir, { recursive: true });

const shared = {
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "esnext",
    external: ["cloudflare:workers"],
    conditions: ["workerd", "worker", "import"],
};

await esbuild.build({
    ...shared,
    absWorkingDir: packageRoot,
    entryPoints: ["src/server/yjs/platform/user-server.ts"],
    outfile: resolve(outdir, "user-server.bundle.txt"),
});

await esbuild.build({
    ...shared,
    absWorkingDir: resolve(packageRoot, "../.."),
    entryPoints: ["tests/e2e/src/server/yjs/platform/facet.ts"],
    outfile: resolve(outdir, "facet.bundle.txt"),
    external: ["cloudflare:workers", "user-server.js"],
    alias: {
        "@pluv/platform": resolve(packageRoot, "../../packages/platform/src/index.ts"),
    },
});
