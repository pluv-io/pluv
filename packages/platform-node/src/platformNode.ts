import type { CrdtLibraryType, NoopCrdtDocFactory } from "@pluv/crdt";
import type { CreateIOParams, InferInitContextType, PluvContext, PluvIOAuthorize } from "@pluv/io";
import type { BaseUser, Id, IOAuthorize, Json } from "@pluv/types";
import type { NodePlatformConfig } from "./NodePlatform";
import { NodePlatform } from "./NodePlatform";
import type { InferCallback } from "./infer";

export type PlatformNodeCreateIOParams<
    TMeta extends Record<string, Json> = {},
    TContext extends Record<string, any> = {},
    TUser extends BaseUser | null = null,
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<NoopCrdtDocFactory>,
> = Id<
    NodePlatformConfig<TMeta> &
        Omit<
            CreateIOParams<
                NodePlatform<IOAuthorize<TUser, TContext>, TMeta>,
                TContext,
                TUser,
                TCrdt
            >,
            "authorize" | "context" | "platform"
        > & {
            authorize?: PluvIOAuthorize<
                NodePlatform<IOAuthorize<TUser, TContext>, TMeta>,
                TUser,
                InferInitContextType<NodePlatform<IOAuthorize<TUser, TContext>, TMeta>>
            >;
            context?: PluvContext<NodePlatform<IOAuthorize<TUser, any>, TMeta>, TContext>;
            types?: InferCallback<TMeta>;
        }
>;

export const platformNode = <
    TMeta extends Record<string, Json> = {},
    TContext extends Record<string, any> = {},
    TUser extends BaseUser | null = null,
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<NoopCrdtDocFactory>,
>(
    config: PlatformNodeCreateIOParams<TMeta, TContext, TUser, TCrdt> = {},
): CreateIOParams<NodePlatform<IOAuthorize<TUser, TContext>, TMeta>, TContext, TUser, TCrdt> => {
    const { authorize, context, crdt, debug, limits } = config;

    return {
        authorize,
        context,
        crdt,
        debug,
        limits,
        platform: () => new NodePlatform<IOAuthorize<TUser, TContext>, TMeta>(config),
    };
};
