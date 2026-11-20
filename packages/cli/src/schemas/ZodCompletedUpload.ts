import { z } from "zod";

export const ZodCompletedUpload = z.object({
    id: z.string().min(1),
    status: z.string().min(1),
});

export type CompletedUpload = z.infer<typeof ZodCompletedUpload>;
