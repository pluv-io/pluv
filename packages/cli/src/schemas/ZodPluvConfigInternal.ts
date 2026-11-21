import { z } from "zod";

const ZodServiceUrl = z.url({ error: "Service URLs must be absolute URLs." });

/** @internal Fields under `~` in pluv config — not part of the public config surface. */
export const ZodPluvConfigInternal = z
    .object({
        apiUrl: ZodServiceUrl.default("https://api.pluv.io"),
        appUrl: ZodServiceUrl.default("https://app.pluv.io"),
        authUrl: ZodServiceUrl.default("https://auth.pluv.io"),
    })
    .strict();

export type PluvConfigInternal = z.infer<typeof ZodPluvConfigInternal>;

export const defaultPluvConfigInternal = ZodPluvConfigInternal.parse({});
