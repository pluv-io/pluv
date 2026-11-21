import { z } from "zod";

export const ZodProject = z.object({
    name: z.string(),
    urlSlug: z.string(),
});

export type Project = z.infer<typeof ZodProject>;
