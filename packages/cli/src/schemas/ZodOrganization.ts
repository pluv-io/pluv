import { z } from "zod";

export const ZodOrganization = z.object({
    name: z.string(),
    slug: z.string(),
});

export type Organization = z.infer<typeof ZodOrganization>;
