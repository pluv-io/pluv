import { z } from "zod";

export const DEFAULT_ENTRY = "./pluv.ts";
export const DEFAULT_PORT = 8787;

const portError = { error: "port must be an integer from 1 to 65535." } as const;

const ZodPortSchema = z.number(portError).int(portError).min(1, portError).max(65535, portError);

const ZodEntrySchema = z
    .string({ error: "entry must be a module path." })
    .min(1, { error: "entry must be a module path." });

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
        port: ZodPortSchema.optional(),
        /**
         * Copied onto the room's `process.env`.
         * Map values from `process.env` after `.env` is loaded. Keys starting with `PLUV_` are reserved.
         */
        env: ZodEnvSchema.optional(),
    })
    .strict();

export type PluvConfigFile = z.infer<typeof ZodPluvConfigFileSchema>;

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
    port: ZodPortSchema.default(DEFAULT_PORT),
    env: ZodEnvSchema.default({}),
});

export type PluvConfig = z.infer<typeof ZodPluvConfigSchema>;
