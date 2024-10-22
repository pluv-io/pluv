import type { JsonPrimitive } from "@pluv/types";
import type { NodePlatformConfig } from "./NodePlatform";
import { NodePlatform } from "./NodePlatform";

export const platformNode = <TMeta extends Record<string, JsonPrimitive> = {}>(
    config: NodePlatformConfig<TMeta> = {},
): NodePlatform<TMeta> => {
    return new NodePlatform<TMeta>(config);
};
