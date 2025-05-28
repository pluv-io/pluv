import type { CrdtLibraryType, NoopCrdtDocFactory } from "@pluv/crdt";
import type { BaseUser } from "@pluv/types";
import type { AbstractPlatform, InferInitContextType } from "./AbstractPlatform";
import type { PluvIOConfig } from "./PluvIO";
import { PluvIO } from "./PluvIO";
import type { PluvContext, PluvIOAuthorize, PluvIOLimits } from "./types";

export type CreateIOParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends Record<string, any> = {},
    TUser extends BaseUser | null = null,
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<NoopCrdtDocFactory>,
> = {
    authorize?: PluvIOAuthorize<TPlatform, TUser, InferInitContextType<TPlatform>>;
    context?: PluvContext<TPlatform, TContext>;
    crdt?: TCrdt;
    debug?: boolean;
    limits?: PluvIOLimits;
    platform: () => TPlatform;
};

export const createIO = <
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends Record<string, any> = {},
    TUser extends BaseUser | null = null,
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<NoopCrdtDocFactory>,
>(
    params: CreateIOParams<TPlatform, TContext, TUser, TCrdt>,
): PluvIO<
    TPlatform,
    PluvIOAuthorize<TPlatform, TUser, InferInitContextType<TPlatform>>,
    TContext,
    TCrdt
> => {
    const { authorize, context, crdt, debug, limits, platform } = params;

    return new PluvIO<
        TPlatform,
        PluvIOAuthorize<TPlatform, TUser, InferInitContextType<TPlatform>>,
        TContext,
        TCrdt
    >({
        authorize,
        context,
        crdt,
        debug,
        limits,
        platform,
    } as PluvIOConfig<
        TPlatform,
        PluvIOAuthorize<TPlatform, TUser, InferInitContextType<TPlatform>>,
        TContext,
        TCrdt
    >);
};
