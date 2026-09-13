import { createBaseRouter } from "./createBaseRouter";

/**
 * Maintainer / test-only surface. Not part of the public API — shape and
 * contents may change without a semver bump. Prefer public exports for apps.
 */
export const __internal = {
    createBaseRouter,
};
