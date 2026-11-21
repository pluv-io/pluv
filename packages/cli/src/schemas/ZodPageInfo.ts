import { z } from "zod";

export const ZodPageInfo = z.object({
    hasNextPage: z.boolean(),
});
