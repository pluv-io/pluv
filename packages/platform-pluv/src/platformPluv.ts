import type { CrdtLibraryType } from "@pluv/crdt";
import type { CreateIOParams, InferInitContextType, PluvContext, PluvIOAuthorize } from "@pluv/io";
import type { BaseUser, Id } from "@pluv/types";
import type { PluvPlatformConfig } from "./PluvPlatform";
import { PluvPlatform } from "./PluvPlatform";

export type PlatformPluvCreateIOParams<
    TContext extends Record<string, any> = {},
    TUser extends BaseUser = BaseUser,
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<any>,
> = Id<
    PluvPlatformConfig &
        Omit<
            CreateIOParams<PluvPlatform, TContext, TUser, TCrdt>,
            "authorize" | "context" | "limits" | "platform"
        > & {
            authorize: PluvIOAuthorize<PluvPlatform, TUser, InferInitContextType<PluvPlatform>>;
            context?: PluvContext<PluvPlatform, TContext>;
        }
>;

export const platformPluv = <
    TContext extends Record<string, any> = {},
    TUser extends BaseUser = BaseUser,
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<any>,
>(
    config: PlatformPluvCreateIOParams<TContext, TUser, TCrdt>,
): CreateIOParams<PluvPlatform<TContext, TUser>, TContext, TUser, TCrdt> => {
    const { authorize, context, crdt, debug } = config;

    return {
        authorize,
        context,
        crdt,
        debug,
        platform: () => new PluvPlatform<TContext, TUser>(config),
    };
};
