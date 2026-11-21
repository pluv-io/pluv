import { z } from "zod";
import { DEFAULT_DIST_DIR, ZodDistDir } from "./ZodDistDir";
import { ZodEnv } from "./ZodEnv";
import { DEFAULT_PORT, ZodPort } from "./ZodPort";
import { defaultPluvConfigInternal, ZodPluvConfigInternal } from "./ZodPluvConfigInternal";
import { ZodResolvedTypeScript } from "./ZodPluvConfigTypescript";
import { isTypeScriptEntry, typescriptEntryMessage } from "../lib/typescriptEntry";

/** Config after flags and defaults. */
export const ZodPluvConfig = z.object({
    entry: z
        .string({
            error: (issue) =>
                issue.input === undefined
                    ? "pluv dev needs an entry path. Pass one, or set entry in pluv.config.ts."
                    : "entry must be a module path.",
        })
        .min(1, { error: "entry must be a module path." })
        .superRefine((entry, ctx) => {
            if (isTypeScriptEntry(entry)) return;

            ctx.addIssue({
                code: "custom",
                message: typescriptEntryMessage(process.cwd(), entry),
            });
        }),
    distDir: ZodDistDir.default(DEFAULT_DIST_DIR),
    env: ZodEnv.default({}),
    organization: z.string().min(1).optional(),
    port: ZodPort.default(DEFAULT_PORT),
    project: z.string().min(1).optional(),
    typescript: ZodResolvedTypeScript,
    "~": ZodPluvConfigInternal.default(defaultPluvConfigInternal),
});

export type PluvConfig = z.infer<typeof ZodPluvConfig>;
