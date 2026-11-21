import { z } from "zod";

/** The saved CLI login. Login writes it, and later commands read it. */
export const ZodCliSession = z.object({
    expiresAt: z.string().min(1),
    token: z.string().min(1),
});

export type CliSession = z.infer<typeof ZodCliSession>;
