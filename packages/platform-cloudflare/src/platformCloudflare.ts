import type { CloudflarePlatformConfig } from "./CloudflarePlatform";
import { CloudflarePlatform } from "./CloudflarePlatform";

export const platformCloudflare = <TEnv extends Record<string, any> = {}>(config: CloudflarePlatformConfig<TEnv> = {}): CloudflarePlatform<TEnv> => {
    return new CloudflarePlatform<TEnv>(config);
};
