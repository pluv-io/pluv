import { z } from "zod";

export const ZodApiError = z.object({
    message: z.string().min(1),
});
