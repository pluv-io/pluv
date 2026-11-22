import { z } from "zod";

/** TypeScript options for `pluv build`, shaped like Next.js `typescript`. */
export const ZodPluvConfigTypescript = z
    .object({
        /**
         * Allow `pluv build` to finish when the entry graph has type errors.
         * `pluv build --no-typecheck` skips the check for that run.
         */
        ignoreBuildErrors: z.boolean().optional(),
    })
    .strict();

/** Resolved TypeScript options. The check runs unless this is true. */
export const ZodResolvedTypeScript = z
    .object({
        ignoreBuildErrors: z.boolean().default(false),
    })
    .default({ ignoreBuildErrors: false });
