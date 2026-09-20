import type { TreatyLike } from "@pluv/types";
import type { AbstractPlatform } from "./AbstractPlatform";
import { PluvIO } from "./PluvIO";
import type { PluvContext, PluvIOLimits, PluvIOSecret } from "./types";

export type IOConfigParams<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TTreaty extends TreatyLike = TreatyLike,
    TContext extends Record<string, any> = {},
> = {
    context?: PluvContext<TPlatform, TContext>;
    debug?: boolean;
    limits?: PluvIOLimits;
    treaty: TTreaty;
} & (TPlatform["_config"]["authorize"]["secret"] extends true
    ? { secret: PluvIOSecret<TPlatform> }
    : { secret?: PluvIOSecret<TPlatform> });

export type IOPlatformFactory<TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>> =
    () => TPlatform;

type ConfiguredIODefs<
    TPlatform extends AbstractPlatform<any>,
    TTreaty extends TreatyLike,
    TContext extends Record<string, any>,
> = {
    platform: TPlatform;
    treaty: TTreaty;
    context: TContext;
    events: {};
};

export interface IOConfigBuilder<TPlatform extends AbstractPlatform<any>> {
    config: <TTreaty extends TreatyLike, TContext extends Record<string, any> = {}>(
        params: IOConfigParams<TPlatform, TTreaty, TContext>,
    ) => PluvIO<ConfiguredIODefs<TPlatform, TTreaty, TContext>>;
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
        config: <TTreaty extends TreatyLike, TContext extends Record<string, any> = {}>(
            params: IOConfigParams<TPlatform, TTreaty, TContext>,
        ): PluvIO<ConfiguredIODefs<TPlatform, TTreaty, TContext>> => {
            const { context, debug, limits, secret, treaty } = params;

            return new PluvIO<ConfiguredIODefs<TPlatform, TTreaty, TContext>>({
                context,
                debug,
                limits,
                platform,
                secret,
                treaty,
            });
        },
    }),
});
