import type { CreateIOParams, InferInitContextType, PluvContext, PluvIOAuthorize } from "@pluv/io";
import type { BaseUser, Json } from "@pluv/types";
import type { NodePlatformConfig } from "./NodePlatform";
import { NodePlatform } from "./NodePlatform";
import type { InferCallback } from "./infer";

export type PlatformNodeCreateIOParams<
    TMeta extends Record<string, Json> = {},
    TContext extends Record<string, any> = {},
    TUser extends BaseUser | null = null,
> = NodePlatformConfig<TMeta> &
    Omit<CreateIOParams<NodePlatform<TMeta>, TContext, TUser>, "authorize" | "context" | "platform"> & {
        authorize?: PluvIOAuthorize<NodePlatform<TMeta>, TUser, InferInitContextType<NodePlatform<TMeta>>>;
        context?: PluvContext<NodePlatform<TMeta>, TContext>;
        types?: InferCallback<TMeta>;
    };

export const platformNode = <
    TMeta extends Record<string, Json> = {},
    TContext extends Record<string, any> = {},
    TUser extends BaseUser | null = null,
>(
    config: PlatformNodeCreateIOParams<TMeta, TContext, TUser> = {},
): CreateIOParams<NodePlatform<TMeta>, TContext, TUser> => {
    const { authorize, context, crdt, debug } = config;

    return {
        authorize,
        context,
        crdt,
        debug,
        platform: new NodePlatform<TMeta>(config),
    };
};
