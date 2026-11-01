import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import * as esbuild from "esbuild";

const shared = {
    bundle: true,
    format: "esm" as const,
    platform: "neutral" as const,
    target: "esnext" as const,
    conditions: ["workerd", "worker", "import"],
    logLevel: "silent" as const,
};

export type BundleRoomOptions = {
    /** Module whose default export is the `io.server()` result. */
    userEntry: string;
    outdir: string;
    /** Working directory for the user bundle. Relative entries resolve from here. */
    absWorkingDir?: string;
    /** Working directory for the facet bundle. */
    facetAbsWorkingDir?: string;
    /** Replaces package imports while bundling. */
    alias?: Record<string, string>;
    /** Facet source. Defaults to this package's built facet. */
    facetEntry?: string;
};

export type BundleRoomResult = {
    facetBundle: string;
    serverBundle: string;
    serverModule: string;
};

const require = createRequire(import.meta.url);

const defaultFacetEntry = (): string => {
    return join(dirname(require.resolve("pluv/supervisor")), "facet.js");
};

/** Bundles the io server and the room facet for the worker loader. */
export const bundleRoom = async (options: BundleRoomOptions): Promise<BundleRoomResult> => {
    const outdir = options.outdir;
    const facetBundle = resolve(outdir, "facet.bundle.txt");
    const serverBundle = resolve(outdir, "server.bundle.txt");
    const serverModule = resolve(outdir, "server.bundle.mjs");

    await mkdir(outdir, { recursive: true });

    const facetEntry = options.facetEntry ?? defaultFacetEntry();

    await esbuild.build({
        ...shared,
        absWorkingDir: options.absWorkingDir ?? dirname(options.userEntry),
        entryPoints: [options.userEntry],
        outfile: serverModule,
        external: ["cloudflare:workers"],
        ...(options.alias ? { alias: options.alias } : {}),
    });
    await copyFile(serverModule, serverBundle);

    await esbuild.build({
        ...shared,
        absWorkingDir: options.facetAbsWorkingDir ?? dirname(facetEntry),
        entryPoints: [facetEntry],
        outfile: facetBundle,
        external: ["cloudflare:workers", "server.js"],
        ...(options.alias ? { alias: options.alias } : {}),
    });

    return { facetBundle, serverBundle, serverModule };
};
