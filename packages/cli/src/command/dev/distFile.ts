import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

/** A file next to the built `pluv/supervisor` entry. */
export const distFile = (name: string): string => {
    return join(dirname(require.resolve("pluv/supervisor")), name);
};
