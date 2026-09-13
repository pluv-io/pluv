import type { CrdtLibraryType, NoopCrdtDocFactory } from "@pluv/crdt";
import type { BaseUser } from "@pluv/types";
import type { AbstractPlatform, InferInitContextType } from "./AbstractPlatform";
import { PluvIO } from "./PluvIO";
import type { PluvContext, PluvIOAuthorize, PluvIOLimits } from "./types";

export type IOConfigParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TUser extends BaseUser = BaseUser,
    TContext extends Record<string, any> = {},
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<NoopCrdtDocFactory>,
> = {
    authorize: PluvIOAuthorize<TPlatform, TUser, InferInitContextType<TPlatform>>;
    context?: PluvContext<TPlatform, TContext>;
    crdt?: TCrdt;
    debug?: boolean;
    limits?: PluvIOLimits;
};

export type IOPlatformFactory<TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>> =
    () => TPlatform;

type ConfiguredIODefs<
    TPlatform extends AbstractPlatform<any>,
    TUser extends BaseUser,
    TContext extends Record<string, any>,
    TCrdt extends CrdtLibraryType<any>,
> = {
    platform: TPlatform;
    authorize: PluvIOAuthorize<TPlatform, TUser, InferInitContextType<TPlatform>>;
    context: TContext;
    crdt: TCrdt;
    events: {};
};

export interface IOConfigBuilder<TPlatform extends AbstractPlatform<any>> {
    config: <
        TUser extends BaseUser,
        TContext extends Record<string, any> = {},
        TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<NoopCrdtDocFactory>,
    >(
        params: IOConfigParams<TPlatform, TUser, TContext, TCrdt>,
    ) => PluvIO<ConfiguredIODefs<TPlatform, TUser, TContext, TCrdt>>;
}

export interface IOPlatformBuilder {
    platform: <TPlatform extends AbstractPlatform<any>>(
        platform: IOPlatformFactory<TPlatform>,
    ) => IOConfigBuilder<TPlatform>;
}

export const createIO = (): IOPlatformBuilder => ({
    platform: <TPlatform extends AbstractPlatform<any>>(
        platform: IOPlatformFactory<TPlatform>,
    ) => ({
        config: <
            TUser extends BaseUser,
            TContext extends Record<string, any> = {},
            TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<NoopCrdtDocFactory>,
        >(
            params: IOConfigParams<TPlatform, TUser, TContext, TCrdt>,
        ): PluvIO<ConfiguredIODefs<TPlatform, TUser, TContext, TCrdt>> => {
            const { authorize, context, crdt, debug, limits } = params;

            return new PluvIO<ConfiguredIODefs<TPlatform, TUser, TContext, TCrdt>>({
                authorize,
                context,
                crdt,
                debug,
                limits,
                platform,
            });
        },
    }),
});
