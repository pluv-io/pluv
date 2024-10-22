import type { Json } from "@pluv/types";
import type { CloudflarePlatformConfig } from "./CloudflarePlatform";
import { CloudflarePlatform } from "./CloudflarePlatform";

export const platformCloudflare = <TEnv extends Record<string, any> = {}, TMeta extends Record<string, Json> = {}>(
    config: CloudflarePlatformConfig<TEnv, TMeta> = {},
): CloudflarePlatform<TEnv, TMeta> => {
    return new CloudflarePlatform<TEnv, TMeta>(config);
};
