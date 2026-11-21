import { z } from "zod";

export const ZodCreatedUpload = z.object({
    deployment: z.object({
        id: z.string().min(1),
        status: z.string().min(1),
    }),
    uploadUrl: z.string().min(1),
});

export type CreatedUpload = z.infer<typeof ZodCreatedUpload>;
