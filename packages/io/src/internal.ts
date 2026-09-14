import { createBaseRouter } from "./createBaseRouter";
import { createInternalPluvRouter } from "./utils";

/**
 * Maintainer / test-only surface. Not part of the public API — shape and
 * contents may change without a semver bump. Prefer public exports for apps.
 */
export const __internal = {
    createBaseRouter,
    createInternalPluvRouter,
};
