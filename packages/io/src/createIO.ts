import type {
    BaseClientEventRecord,
    BaseIOEventRecord,
    BaseUser,
    IOAuthorize,
    JsonObject,
    Maybe,
    MaybePromise,
} from "@pluv/types";
import type { AbstractPlatform } from "./AbstractPlatform";
import type { GetInitialStorageFn, PluvIOListeners } from "./PluvIO";
import { PluvIO } from "./PluvIO";

export type CreateIOParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends JsonObject = {},
    TAuthorizeUser extends BaseUser = BaseUser,
    TAuthorizeRequired extends boolean = false,
> = Partial<PluvIOListeners<TPlatform>> & {
    authorize?: IOAuthorize<TAuthorizeUser, TAuthorizeRequired>;
    context?: TContext;
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
    params: CreateIOParams<
        TPlatform,
        TContext,
        TAuthorizeUser,
        TAuthorizeRequired
    >,
): PluvIO<
    TPlatform,
    IOAuthorize<TAuthorizeUser, TAuthorizeRequired>,
    TContext,
    BaseClientEventRecord,
    BaseIOEventRecord<IOAuthorize<TAuthorizeUser, TAuthorizeRequired>>
> => {
    const {
        authorize,
        context,
        debug,
        getInitialStorage,
        onRoomDeleted,
        onStorageUpdated,
        platform,
    } = params;

    return new PluvIO<
        TPlatform,
        IOAuthorize<TAuthorizeUser, TAuthorizeRequired>,
        TContext,
        BaseClientEventRecord,
        BaseIOEventRecord<IOAuthorize<TAuthorizeUser, TAuthorizeRequired>>
    >({
        authorize,
        context,
        debug,
        getInitialStorage,
        onRoomDeleted,
        onStorageUpdated,
        platform,
    });
};
