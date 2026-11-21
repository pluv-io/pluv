import { z } from "zod";

export const ZodWhoamiAccount = z.object({
    email: z.string().min(1),
    id: z.string().min(1),
    name: z.string(),
});

export type WhoamiAccount = z.infer<typeof ZodWhoamiAccount>;
