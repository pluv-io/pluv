import { z } from "zod";
import { ZodDistDir } from "./ZodDistDir";
import { ZodEntry } from "./ZodEntry";
import { ZodEnv } from "./ZodEnv";
import { ZodPort } from "./ZodPort";
import { ZodPluvConfigInternal } from "./ZodPluvConfigInternal";

/** Shape of `pluv.config.ts`. Every field is optional until flags are applied. */
export const ZodPluvConfigFile = z
    .object({
        /** Server module. Default export is the `io.server()` result. */
        entry: ZodEntry.optional(),
        /** Directory `pluv build` writes into. The server file is `build/server.js` inside it. Defaults to `.pluv`. */
        distDir: ZodDistDir.optional(),
        /** Organization slug used by `pluv deploy`. */
        organization: z.string().min(1).optional(),
        port: ZodPort.optional(),
        /** Project slug used by `pluv deploy`. */
        project: z.string().min(1).optional(),
        /**
         * Copied onto the room's `process.env`.
         * Map values from `process.env` after `.env` is loaded. Keys starting with `PLUV_` are reserved.
         */
        env: ZodEnv.optional(),
        /**
         * @internal
         * Local service URLs for login and deploy. An environment variable still wins.
         */
        "~": ZodPluvConfigInternal.optional(),
    })
    .strict();

type PluvConfigFileOutput = z.infer<typeof ZodPluvConfigFile>;

export interface PluvConfigFile extends PluvConfigFileOutput {
    /**
     * @internal
     * Local service URLs for login and deploy. An environment variable still wins.
     */
    "~"?: NonNullable<PluvConfigFileOutput["~"]>;
}
