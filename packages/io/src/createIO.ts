import type { BaseUser } from "@pluv/types";
import type { AbstractPlatform, InferInitContextType } from "./AbstractPlatform";
import { PluvIO } from "./PluvIO";
import type { CrdtLibraryType, PluvContext, PluvIOAuthorize } from "./types";

export type CreateIOParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends Record<string, any> = {},
    TAuthorizeUser extends BaseUser = BaseUser,
    TAuthorizeRequired extends boolean = false,
> = {
    authorize?: PluvIOAuthorize<TPlatform, TAuthorizeUser, TAuthorizeRequired, InferInitContextType<TPlatform>>;
    context?: PluvContext<TPlatform, TContext>;
    crdt?: CrdtLibraryType;
    debug?: boolean;
    platform: TPlatform;
};

export const createIO = <
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends Record<string, any> = {},
    TAuthorizeUser extends BaseUser = BaseUser,
    TAuthorizeRequired extends boolean = false,
>(
    params: CreateIOParams<TPlatform, TContext, TAuthorizeUser, TAuthorizeRequired>,
): PluvIO<
    TPlatform,
    PluvIOAuthorize<TPlatform, TAuthorizeUser, TAuthorizeRequired, InferInitContextType<TPlatform>>,
    TContext
> => {
    const { authorize, context, crdt, debug, platform } = params;

    return new PluvIO<
        TPlatform,
        PluvIOAuthorize<TPlatform, TAuthorizeUser, TAuthorizeRequired, InferInitContextType<TPlatform>>,
        TContext
    >({
        authorize: authorize as PluvIOAuthorize<
            TPlatform,
            TAuthorizeUser,
            TAuthorizeRequired,
            InferInitContextType<TPlatform>
        >,
        context,
        crdt,
        debug,
        platform,
    });
};
