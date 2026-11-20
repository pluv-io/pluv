import type { PluvConfigInternal } from "../schemas";
import { resolvePluvConfigInternal } from "./resolvePluvConfigInternal";

let cached: PluvConfigInternal | undefined;

/** Remember URLs from the resolved `pluv` config for the current command. */
export const cacheServiceUrls = (urls: PluvConfigInternal): void => {
    cached = urls;
};

export const resetServiceUrlsCache = (): void => {
    cached = undefined;
};

/** Cached config `~` URLs, or schema defaults with `PLUV_*_URL` env overrides. */
export const resolveServiceUrls = (): PluvConfigInternal => cached ?? resolvePluvConfigInternal();
