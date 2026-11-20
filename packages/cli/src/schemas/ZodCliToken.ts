import { z } from "zod";

export const ZodCliToken = z.object({
    expiresAt: z.string().min(1),
    token: z.string().min(1),
});

export type CliToken = z.infer<typeof ZodCliToken>;
