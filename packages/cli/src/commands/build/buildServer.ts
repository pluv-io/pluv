import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import * as esbuild from "esbuild";

type BuildServerOptions = {
    cwd: string;
    entry: string;
    distDir: string;
};

/** Bundle the io server module the hosted facet loads as `server.js`. */
export const buildServer = async (options: BuildServerOptions): Promise<string> => {
    const outfile = join(options.distDir, "build/server.js");

    await mkdir(dirname(outfile), { recursive: true });
    await esbuild.build({
        absWorkingDir: options.cwd,
        bundle: true,
        conditions: ["workerd", "worker", "import"],
        entryPoints: [options.entry],
        external: ["cloudflare:workers"],
        format: "esm",
        logLevel: "silent",
        outfile,
        platform: "neutral",
        target: "esnext",
    });

    return outfile;
};
