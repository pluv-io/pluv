import type { BaseUser } from "@pluv/types";
import type { AbstractPlatform, InferInitContextType } from "./AbstractPlatform";
import { PluvIO } from "./PluvIO";
import type { CrdtLibraryType, PluvContext, PluvIOAuthorize } from "./types";

export type CreateIOParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends Record<string, any> = {},
    TUser extends BaseUser | null = null,
> = {
    authorize?: PluvIOAuthorize<TPlatform, TUser, InferInitContextType<TPlatform>>;
    context?: PluvContext<TPlatform, TContext>;
    crdt?: CrdtLibraryType;
    debug?: boolean;
    platform: TPlatform;
};

export const createIO = <
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends Record<string, any> = {},
    TUser extends BaseUser | null = null,
>(
    params: CreateIOParams<TPlatform, TContext, TUser>,
): PluvIO<TPlatform, PluvIOAuthorize<TPlatform, TUser, InferInitContextType<TPlatform>>, TContext> => {
    const { authorize, context, crdt, debug, platform } = params;

    return new PluvIO<TPlatform, PluvIOAuthorize<TPlatform, TUser, InferInitContextType<TPlatform>>, TContext>({
        authorize,
        context,
        crdt,
        debug,
        platform,
    });
};
