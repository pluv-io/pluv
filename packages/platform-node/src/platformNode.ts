import type { NodePlatformConfig } from "./NodePlatform";
import { NodePlatform } from "./NodePlatform";

export const platformNode = (config: NodePlatformConfig = {}): NodePlatform => {
    return new NodePlatform(config);
};
