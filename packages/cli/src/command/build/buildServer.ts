import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import * as esbuild from "esbuild";

/** Bundle the io server module the hosted facet loads as `server.js`. */
export const buildServer = async (cwd: string, entry: string): Promise<string> => {
    const outfile = resolve(cwd, ".pluv/build/server.js");

    await mkdir(resolve(cwd, ".pluv/build"), { recursive: true });
    await esbuild.build({
        absWorkingDir: cwd,
        bundle: true,
        conditions: ["workerd", "worker", "import"],
        entryPoints: [entry],
        external: ["cloudflare:workers"],
        format: "esm",
        logLevel: "silent",
        outfile,
        platform: "neutral",
        target: "esnext",
    });

    return outfile;
};
