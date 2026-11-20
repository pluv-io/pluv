import { z } from "zod";
import { ZodPluvConfigInternal, type PluvConfigInternal } from "../schemas";

const envUrl = (name: string, fallback: string): string => {
    const value = process.env[name];

    return value && value.length > 0 ? value : fallback;
};

/** Merge file `~` values, schema defaults, and `PLUV_*_URL` env overrides. */
export const resolvePluvConfigInternal = (
    fromFile?: z.input<typeof ZodPluvConfigInternal>,
): PluvConfigInternal => {
    const parsed = ZodPluvConfigInternal.parse(fromFile ?? {});

    return {
        apiUrl: envUrl("PLUV_API_URL", parsed.apiUrl),
        appUrl: envUrl("PLUV_APP_URL", parsed.appUrl),
        authUrl: envUrl("PLUV_AUTH_URL", parsed.authUrl),
    };
};
