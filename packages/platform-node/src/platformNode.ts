import type { CrdtLibraryType, NoopCrdtDocFactory } from "@pluv/crdt";
import type { CreateIOParams, PluvContext, PluvIOAuthorize } from "@pluv/io";
import type { BaseUser, Id, IOAuthorize, Json } from "@pluv/types";
import type { IncomingMessage } from "node:http";
import type { NodePlatformConfig } from "./NodePlatform";
import { NodePlatform } from "./NodePlatform";
import type { InferCallback } from "./infer";
import type { NodeAuthorizeContext } from "./types";
import { toRequest } from "./utils/toRequest";

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
                NodeAuthorizeContext
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
    const { authorize, context, crdt, debug, limits, origin } = config;

    const resolvedAuthorize =
        typeof authorize === "function"
            ? (input: { request: Request | IncomingMessage }) =>
                  authorize({ request: toRequest(input.request, { origin }) })
            : authorize;

    return {
        authorize: resolvedAuthorize,
        context,
        crdt,
        debug,
        limits,
        platform: () => new NodePlatform<IOAuthorize<TUser, TContext>, TMeta>(config),
    };
};
