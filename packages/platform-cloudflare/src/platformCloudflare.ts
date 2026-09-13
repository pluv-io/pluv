import type { Id, Json } from "@pluv/types";
import type { CloudflarePlatformConfig } from "./CloudflarePlatform";
import { CloudflarePlatform } from "./CloudflarePlatform";
import type { InferCallback } from "./infer";

export type PlatformCloudflareParams<
    TEnv extends Record<string, any> = {},
    TMeta extends Record<string, Json> = {},
> = Id<
    CloudflarePlatformConfig<TEnv, TMeta> & {
        types?: InferCallback<TEnv, TMeta>;
    }
>;

export const platformCloudflare = <
    TEnv extends Record<string, any> = {},
    TMeta extends Record<string, Json> = {},
>(
    config: PlatformCloudflareParams<TEnv, TMeta> = {} as PlatformCloudflareParams<TEnv, TMeta>,
): (() => CloudflarePlatform<TEnv, TMeta>) => {
    return () => new CloudflarePlatform<TEnv, TMeta>(config);
};
