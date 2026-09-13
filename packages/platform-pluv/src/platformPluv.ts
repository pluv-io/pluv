import type { PluvPlatformConfig } from "./PluvPlatform";
import { PluvPlatform } from "./PluvPlatform";

export type PlatformPluvParams = PluvPlatformConfig;

export const platformPluv = (config: PlatformPluvParams): (() => PluvPlatform) => {
    return () => new PluvPlatform(config);
};
