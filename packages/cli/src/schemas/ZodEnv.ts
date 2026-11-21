import { z } from "zod";

export const ZodEnv = z
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
