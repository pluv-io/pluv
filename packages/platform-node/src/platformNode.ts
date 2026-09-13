import type { Id, Json } from "@pluv/types";
import type { NodePlatformConfig } from "./NodePlatform";
import { NodePlatform } from "./NodePlatform";
import type { InferCallback } from "./infer";

export type PlatformNodeParams<TMeta extends Record<string, Json> = {}> = Id<
    NodePlatformConfig<TMeta> & {
        types?: InferCallback<TMeta>;
    }
>;

export const platformNode = <TMeta extends Record<string, Json> = {}>(
    config: PlatformNodeParams<TMeta> = {} as PlatformNodeParams<TMeta>,
): (() => NodePlatform<TMeta>) => {
    return () => new NodePlatform<TMeta>(config);
};
