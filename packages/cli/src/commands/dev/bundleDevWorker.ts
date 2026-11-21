import { rename } from "node:fs/promises";
import { resolve } from "node:path";
import * as esbuild from "esbuild";
import { distFile } from "./distFile";

type BundleDevWorkerOptions = {
    facetBundle: string;
    root: string;
    env: Record<string, string>;
    serverBundle: string;
    version: string;
};

/** Bundle `worker.ts`, injecting the values known when `pluv dev` starts. */
export const bundleDevWorker = async (options: BundleDevWorkerOptions): Promise<void> => {
    const outfile = resolve(options.root, "worker.mjs");
    const temporary = `${outfile}.tmp`;

    await esbuild.build({
        absWorkingDir: options.root,
        alias: {
            "pluv-dev/facet-source": options.facetBundle,
            "pluv-dev/server-source": options.serverBundle,
        },
        bundle: true,
        conditions: ["workerd", "worker", "import"],
        define: {
            __PLUV_DEV_ENV: JSON.stringify(options.env),
            __PLUV_DEV_VERSION: JSON.stringify(options.version),
        },
        entryPoints: [distFile("dev/worker.ts")],
        external: ["cloudflare:workers"],
        format: "esm",
        keepNames: true,
        loader: { ".txt": "text" },
        logLevel: "silent",
        outfile: temporary,
        platform: "neutral",
        target: "esnext",
    });
    await rename(temporary, outfile);
};
