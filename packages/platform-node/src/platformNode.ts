import type { NodePlatformOptions } from "./NodePlatform";
import { NodePlatform } from "./NodePlatform";

export const platformNode = (
    options: NodePlatformOptions = {},
): NodePlatform => {
    return new NodePlatform(options);
};
