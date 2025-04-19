import type { CreateIOParams, InferInitContextType, PluvContext, PluvIOAuthorize } from "@pluv/io";
import type { BaseUser, Id, IOAuthorize, Json } from "@pluv/types";
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
        Omit<
            CreateIOParams<CloudflarePlatform<IOAuthorize<TUser, TContext>, TEnv, TMeta>, TContext, TUser>,
            "authorize" | "context" | "platform"
        > & {
            authorize?: PluvIOAuthorize<
                CloudflarePlatform<IOAuthorize<TUser, TContext>, TEnv, TMeta>,
                TUser,
                InferInitContextType<CloudflarePlatform<IOAuthorize<TUser, TContext>, TEnv, TMeta>>
            >;
            context?: PluvContext<CloudflarePlatform<IOAuthorize<TUser, any>, TEnv, TMeta>, TContext>;
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
): CreateIOParams<CloudflarePlatform<IOAuthorize<TUser, TContext>, TEnv, TMeta>, TContext, TUser> => {
    const { authorize, context, crdt, debug } = config;

    return {
        authorize,
        context,
        crdt,
        debug,
        platform: new CloudflarePlatform<IOAuthorize<TUser, TContext>, TEnv, TMeta>(config),
    };
};
