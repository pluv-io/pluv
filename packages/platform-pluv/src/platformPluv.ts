import type { PluvPlatformConfig } from "./PluvPlatform";
import { PluvPlatform } from "./PluvPlatform";

export const platformPluv = (config: PluvPlatformConfig) => {
    return new PluvPlatform(config);
};
