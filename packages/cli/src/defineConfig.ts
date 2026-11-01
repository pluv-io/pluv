import type { PluvConfigFile } from "./schemas";

export type { PluvConfigFile };

/** Types `pluv.config.ts`. `pluv dev` validates the file when it loads. */
export const defineConfig = (config: PluvConfigFile): PluvConfigFile => config;
