import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { BaseUser, IOAuthorize, JsonObject } from "@pluv/types";
import type { AbstractPlatform, InferPlatformContextType } from "./AbstractPlatform";
import { PluvIO } from "./PluvIO";
import type { GetInitialStorageFn } from "./types";

export type CreateIOParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends JsonObject = {},
    TAuthorizeUser extends BaseUser = BaseUser,
    TAuthorizeRequired extends boolean = false,
> = {
    authorize?: IOAuthorize<TAuthorizeUser, TAuthorizeRequired, InferPlatformContextType<TPlatform>>;
    context?: TContext;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any> };
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
): PluvIO<
    TPlatform,
    IOAuthorize<TAuthorizeUser, TAuthorizeRequired, InferPlatformContextType<TPlatform>>,
    TContext
> => {
    const { authorize, context, crdt, debug, platform } = params;

    return new PluvIO<
        TPlatform,
        IOAuthorize<TAuthorizeUser, TAuthorizeRequired, InferPlatformContextType<TPlatform>>,
        TContext
    >({
        authorize,
        context,
        crdt,
        debug,
        platform,
    });
};
