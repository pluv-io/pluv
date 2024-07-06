import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { BaseUser, IOAuthorize, JsonObject } from "@pluv/types";
import type { AbstractPlatform, InferPlatformContextType } from "./AbstractPlatform";
import { PluvIO } from "./PluvIO";
import type { GetInitialStorageFn, PluvIOListeners } from "./types";

export type CreateIOParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends JsonObject = {},
    TAuthorizeUser extends BaseUser = BaseUser,
    TAuthorizeRequired extends boolean = false,
> = Partial<PluvIOListeners<TPlatform>> & {
    authorize?: IOAuthorize<TAuthorizeUser, TAuthorizeRequired, InferPlatformContextType<TPlatform>>;
    context?: TContext;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    debug?: boolean;
    getInitialStorage?: GetInitialStorageFn<TPlatform>;
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
    const { authorize, context, crdt, debug, getInitialStorage, onRoomDeleted, onStorageUpdated, platform } = params;

    return new PluvIO<
        TPlatform,
        IOAuthorize<TAuthorizeUser, TAuthorizeRequired, InferPlatformContextType<TPlatform>>,
        TContext
    >({
        authorize,
        context,
        crdt,
        debug,
        getInitialStorage,
        onRoomDeleted,
        onStorageUpdated,
        platform,
    });
};
