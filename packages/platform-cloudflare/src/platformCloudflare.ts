import type { CreateIOParams, InferInitContextType, PluvContext, PluvIOAuthorize } from "@pluv/io";
import type { BaseUser, Id, Json } from "@pluv/types";
import type { CloudflarePlatformConfig } from "./CloudflarePlatform";
import { CloudflarePlatform } from "./CloudflarePlatform";
import type { InferCallback } from "./infer";

export type PlatformCloudflareCreateIOParams<
    TEnv extends Record<string, any> = {},
    TMeta extends Record<string, Json> = {},
    TContext extends Record<string, any> = {},
    TUser extends BaseUser | null = null,
> = Id<
    CloudflarePlatformConfig<TEnv, TMeta> &
        Omit<CreateIOParams<CloudflarePlatform<TEnv, TMeta>, TContext, TUser>, "authorize" | "context" | "platform"> & {
            authorize?: PluvIOAuthorize<
                CloudflarePlatform<TEnv, TMeta>,
                TUser,
                InferInitContextType<CloudflarePlatform<TEnv, TMeta>>
            >;
            context?: PluvContext<CloudflarePlatform<TEnv, TMeta>, TContext>;
            types?: InferCallback<TEnv, TMeta>;
        }
>;

export const platformCloudflare = <
    TEnv extends Record<string, any> = {},
    TMeta extends Record<string, Json> = {},
    TContext extends Record<string, any> = {},
    TUser extends BaseUser | null = null,
>(
    config: PlatformCloudflareCreateIOParams<TEnv, TMeta, TContext, TUser> = {},
): CreateIOParams<CloudflarePlatform<TEnv, TMeta>, TContext, TUser> => {
    const { authorize, context, crdt, debug } = config;

    return {
        authorize,
        context,
        crdt,
        debug,
        platform: new CloudflarePlatform<TEnv, TMeta>(config),
    };
};
