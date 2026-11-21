import { z } from "zod";

export const ZodCliCode = z.object({
    code: z.string().min(1),
    verifier: z.string().min(1),
});

export type CliCodeInput = z.infer<typeof ZodCliCode>;
