import type { BaseUser, IOAuthorize, JsonObject } from "@pluv/types";
import type { AbstractPlatform, InferInitContextType } from "./AbstractPlatform";
import { PluvIO } from "./PluvIO";
import type { CrdtLibraryType } from "./types";

export type CreateIOParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends JsonObject = {},
    TAuthorizeUser extends BaseUser = BaseUser,
    TAuthorizeRequired extends boolean = false,
> = {
    authorize?: IOAuthorize<TAuthorizeUser, TAuthorizeRequired, InferInitContextType<TPlatform>>;
    context?: TContext;
    crdt?: CrdtLibraryType;
    debug?: boolean;
    platform: TPlatform;
};

export const createIO = <
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends JsonObject = {},
    TAuthorizeUser extends BaseUser = BaseUser,
    TAuthorizeRequired extends boolean = false,
>(
    params: CreateIOParams<TPlatform, TContext, TAuthorizeUser, TAuthorizeRequired>,
): PluvIO<TPlatform, IOAuthorize<TAuthorizeUser, TAuthorizeRequired, InferInitContextType<TPlatform>>, TContext> => {
    const { authorize, context, crdt, debug, platform } = params;

    return new PluvIO<
        TPlatform,
        IOAuthorize<TAuthorizeUser, TAuthorizeRequired, InferInitContextType<TPlatform>>,
        TContext
    >({
        authorize,
        context,
        crdt,
        debug,
        platform,
    });
};
