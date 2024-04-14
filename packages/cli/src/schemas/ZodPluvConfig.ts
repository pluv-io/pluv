import { z } from "zod";

export const ZodPluvConfig = z.object({
    env: z.record(z.string(), z.string()).optional(),
    input: z.string().default("./pluv.ts"),
    outDir: z.string().default("./.pluv"),
});
