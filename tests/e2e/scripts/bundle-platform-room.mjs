import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { bundleRoom } from "pluv/bundle";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..");
const repoRoot = resolve(packageRoot, "../..");

await bundleRoom({
    absWorkingDir: packageRoot,
    userEntry: "src/server/yjs/platform/user-server.ts",
    facetAbsWorkingDir: repoRoot,
    facetEntry: "packages/cli/src/room/facet.ts",
    outdir: resolve(packageRoot, "src/server/yjs/platform/generated"),
    alias: {
        "@pluv/platform": resolve(repoRoot, "packages/platform/src/index.ts"),
    },
});
