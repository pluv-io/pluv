import type {
    BaseClientEventRecord,
    BaseIOEventRecord,
    BaseUser,
    IOAuthorize,
    JsonObject,
} from "@pluv/types";
import type { AbstractPlatform } from "./AbstractPlatform";
import { PluvIO } from "./PluvIO";

export interface CreateIOParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends JsonObject = {},
    TAuthorizeUser extends BaseUser = BaseUser,
    TAuthorizeRequired extends boolean = false
> {
    authorize?: IOAuthorize<TAuthorizeUser, TAuthorizeRequired>;
    context?: TContext;
    debug?: boolean;
    platform: TPlatform;
}

export const createIO = <
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends JsonObject = {},
    TAuthorizeUser extends BaseUser = BaseUser,
    TAuthorizeRequired extends boolean = false
>(
    params: CreateIOParams<
        TPlatform,
        TContext,
        TAuthorizeUser,
        TAuthorizeRequired
    >
): PluvIO<
    TPlatform,
    IOAuthorize<TAuthorizeUser, TAuthorizeRequired>,
    TContext,
    BaseClientEventRecord,
    BaseIOEventRecord<IOAuthorize<TAuthorizeUser, TAuthorizeRequired>>
> => {
    const { authorize, context, debug, platform } = params;

    return new PluvIO<
        TPlatform,
        IOAuthorize<TAuthorizeUser, TAuthorizeRequired>,
        TContext,
        BaseClientEventRecord,
        BaseIOEventRecord<IOAuthorize<TAuthorizeUser, TAuthorizeRequired>>
    >({ authorize, context, debug, platform });
};
