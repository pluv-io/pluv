import type { AbstractPlatform, InferInitContextType } from "./AbstractPlatform";
import { PluvIO } from "./PluvIO";
import type { CrdtLibraryType, PluvContext, PluvIOAuthorize } from "./types";

export type CreateIOParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends Record<string, any> = {},
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null = null,
> = {
    authorize?: TAuthorize;
    context?: PluvContext<TPlatform, TContext>;
    crdt?: CrdtLibraryType;
    debug?: boolean;
    platform: TPlatform;
};

export const createIO = <
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TContext extends Record<string, any> = {},
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null = null,
>(
    params: CreateIOParams<TPlatform, TContext, TAuthorize>,
): PluvIO<TPlatform, TAuthorize, TContext> => {
    const { authorize, context, crdt, debug, platform } = params;

    return new PluvIO<TPlatform, TAuthorize, TContext>({
        authorize,
        context,
        crdt,
        debug,
        platform,
    });
};
