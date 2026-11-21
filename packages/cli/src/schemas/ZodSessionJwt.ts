import { z } from "zod";

export const ZodSessionJwt = z.object({
    jwt: z.string().min(1),
});
