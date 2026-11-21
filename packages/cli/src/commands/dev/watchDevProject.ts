import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import * as esbuild from "esbuild";
import type { PluvConfig } from "../../schemas";
import { bundleDevWorker } from "./bundleDevWorker";
import { devDir } from "./devDir";
import { distFile } from "./distFile";
import { wranglerConfig } from "./wranglerConfig";

/** The room module sees only this map on `process.env`. */
const roomEnvBanner = (env: Record<string, string>): string => {
    return `globalThis.process ??= { env: {} };
for (const key of Object.keys(globalThis.process.env)) delete globalThis.process.env[key];
Object.assign(globalThis.process.env, ${JSON.stringify(env)});`;
};

type DevProjectWatch = {
    onReady: () => void;
    onReload: () => void;
    onError: (message: string) => void;
};

/**
 * Bundle the room under `.pluv/dev` and rebuild `worker.mjs` when the server module changes.
 * Wrangler reloads that file. The loader version changes with the bundle, and the facet name
 * stays `user`, so SQLite is kept.
 */
export const watchDevProject = async (
    cwd: string,
    config: PluvConfig,
    handlers: DevProjectWatch,
): Promise<() => Promise<void>> => {
    const root = devDir(cwd);
    const generated = resolve(root, "generated");
    const facetBundle = resolve(generated, "facet.bundle.txt");
    const serverBundle = resolve(generated, "server.bundle.txt");
    const serverModule = resolve(generated, "server.bundle.mjs");
    const facetEntry = distFile("facet.js");
    const env = config.env;

    await mkdir(generated, { recursive: true });
    await esbuild.build({
        absWorkingDir: dirname(facetEntry),
        bundle: true,
        conditions: ["workerd", "worker", "import"],
        entryPoints: [facetEntry],
        external: ["cloudflare:workers", "server.js"],
        format: "esm",
        logLevel: "silent",
        outfile: facetBundle,
        platform: "neutral",
        target: "esnext",
    });

    let previousVersion: string | undefined;
    let ready = false;
    let pending = Promise.resolve();

    const context = await esbuild.context({
        absWorkingDir: cwd,
        bundle: true,
        conditions: ["workerd", "worker", "import"],
        entryPoints: [config.entry],
        external: ["cloudflare:workers"],
        banner: { js: roomEnvBanner(env) },
        format: "esm",
        logLevel: "silent",
        outfile: serverModule,
        platform: "neutral",
        plugins: [
            {
                name: "pluv-dev-reload",
                setup: (build) => {
                    build.onEnd((result) => {
                        pending = pending
                            .then(async () => {
                                if (result.errors.length > 0) {
                                    const messages = await esbuild.formatMessages(result.errors, {
                                        color: false,
                                        kind: "error",
                                    });
                                    const text = messages.join("").trim();

                                    handlers.onError(text || "Failed to build the room.");

                                    return;
                                }

                                await copyFile(serverModule, serverBundle);

                                const version = `dev-${createHash("sha256")
                                    .update(await readFile(serverModule))
                                    .digest("hex")
                                    .slice(0, 16)}`;

                                if (version === previousVersion) return;

                                await bundleDevWorker({
                                    facetBundle,
                                    root,
                                    env,
                                    serverBundle,
                                    version,
                                });
                                previousVersion = version;

                                if (!ready) {
                                    await writeFile(
                                        resolve(root, "wrangler.jsonc"),
                                        wranglerConfig(),
                                    );
                                    ready = true;
                                    handlers.onReady();

                                    return;
                                }

                                handlers.onReload();
                            })
                            .catch((error: unknown) => {
                                const text =
                                    error instanceof Error
                                        ? error.message
                                        : "Failed to build the room.";

                                handlers.onError(text);
                            });

                        return pending;
                    });
                },
            },
        ],
        target: "esnext",
    });

    await context.watch();

    return async () => {
        await context.dispose();
    };
};
