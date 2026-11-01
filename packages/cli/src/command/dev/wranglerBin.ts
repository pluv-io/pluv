import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

export const wranglerBin = (): string => {
    const pkg = require.resolve("wrangler/package.json");

    return join(dirname(pkg), "bin/wrangler.js");
};
