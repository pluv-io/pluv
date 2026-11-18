import { z } from "zod";

export const DEFAULT_ENTRY = "./pluv.ts";
export const DEFAULT_DIST_DIR = ".pluv";
export const DEFAULT_PORT = 8787;

const portError = { error: "port must be an integer from 1 to 65535." } as const;

const ZodPortSchema = z.number(portError).int(portError).min(1, portError).max(65535, portError);

const ZodEntrySchema = z
    .string({ error: "entry must be a module path." })
    .min(1, { error: "entry must be a module path." });

const ZodDistDirSchema = z
    .string({ error: "distDir must be a directory path." })
    .min(1, { error: "distDir must be a directory path." });

const ZodServiceUrl = z.url({ error: "Service URLs must be absolute URLs." });

const ZodServiceUrls = z
    .object({
        apiUrl: ZodServiceUrl.optional(),
        appUrl: ZodServiceUrl.optional(),
        authUrl: ZodServiceUrl.optional(),
    })
    .strict();

const ZodEnvSchema = z
    .record(
        z.string().min(1, { error: "env keys must not be empty." }),
        z.string({
            error: (issue) =>
                issue.input === undefined
                    ? "env values must be strings. An unset process.env value cannot be mapped."
                    : "env values must be strings.",
        }),
    )
    .superRefine((env, ctx) => {
        for (const key of Object.keys(env)) {
            if (!key.startsWith("PLUV_")) continue;

            ctx.addIssue({
                code: "custom",
                path: [key],
                message: "Env keys starting with PLUV_ are reserved.",
            });
        }
    });

/** Shape of `pluv.config.ts`. Every field is optional until flags are applied. */
export const ZodPluvConfigFileSchema = z
    .object({
        /** Server module. Default export is the `io.server()` result. */
        entry: ZodEntrySchema.optional(),
        /** Directory `pluv build` writes into. The server file is `build/server.js` inside it. Defaults to `.pluv`. */
        distDir: ZodDistDirSchema.optional(),
        /** Organization slug used by `pluv deploy`. */
        organization: z.string().min(1).optional(),
        port: ZodPortSchema.optional(),
        /** Project slug used by `pluv deploy`. */
        project: z.string().min(1).optional(),
        /**
         * Copied onto the room's `process.env`.
         * Map values from `process.env` after `.env` is loaded. Keys starting with `PLUV_` are reserved.
         */
        env: ZodEnvSchema.optional(),
        /**
         * @internal
         * Local service URLs for login and deploy. An environment variable still wins.
         */
        "~": ZodServiceUrls.optional(),
    })
    .strict();

type PluvConfigFileOutput = z.infer<typeof ZodPluvConfigFileSchema>;

export interface PluvConfigFile extends PluvConfigFileOutput {
    /**
     * @internal
     * Local service URLs for login and deploy. An environment variable still wins.
     */
    "~"?: NonNullable<PluvConfigFileOutput["~"]>;
}

/** Config after flags and defaults. */
export const ZodPluvConfigSchema = z.object({
    entry: z
        .string({
            error: (issue) =>
                issue.input === undefined
                    ? "pluv dev needs an entry path. Pass one, or set entry in pluv.config.ts."
                    : "entry must be a module path.",
        })
        .min(1, { error: "entry must be a module path." }),
    distDir: ZodDistDirSchema.default(DEFAULT_DIST_DIR),
    env: ZodEnvSchema.default({}),
    organization: z.string().min(1).optional(),
    port: ZodPortSchema.default(DEFAULT_PORT),
    project: z.string().min(1).optional(),
    "~": ZodServiceUrls.optional(),
});

export type PluvConfig = z.infer<typeof ZodPluvConfigSchema>;
