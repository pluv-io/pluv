import type { PluvClient, PluvRouterEventConfig } from "@pluv/client";
import type { CrdtType } from "@pluv/crdt";
import type { IOLike, JsonObject } from "@pluv/types";
import type { FC, ReactNode } from "react";
import { createContext, memo, useContext } from "react";
import type { CreateRoomBundle, CreateRoomBundleOptions } from "./createRoomBundle";
import { createRoomBundle as _createRoomBundle } from "./createRoomBundle";

export interface PluvProviderProps {
    children?: ReactNode;
}

export interface CreateBundle<
    TIO extends IOLike,
    TMetadata extends JsonObject,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
> {
    // factories
    createRoomBundle: <TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {}>(
        options: CreateRoomBundleOptions<TIO, TMetadata, TPresence, TStorage, TEvents>,
    ) => CreateRoomBundle<TIO, TMetadata, TPresence, TStorage, TEvents>;

    // components
    PluvProvider: FC<PluvProviderProps>;

    // hooks
    useClient: () => PluvClient<TIO, TPresence, TStorage, TMetadata>;
}

export const createBundle = <
    TIO extends IOLike,
    TMetadata extends JsonObject = {},
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
>(
    client: PluvClient<TIO, TPresence, TStorage, TMetadata>,
): CreateBundle<TIO, TMetadata, TPresence, TStorage> => {
    /**
     * !HACK
     * @description We'll let the context error out if client is not provided,
     * and let the users deal with it.
     * @author leedavidcs
     * @date October 27, 2022
     */
    const PluvContext = createContext<PluvClient<TIO, TPresence, TStorage, TMetadata>>(null as any);

    const PluvProvider = memo<PluvProviderProps>((props) => {
        const { children } = props;

        return <PluvContext.Provider value={client}>{children}</PluvContext.Provider>;
    });

    PluvProvider.displayName = "PluvProvider";

    const useClient = (): PluvClient<TIO, TPresence, TStorage, TMetadata> => useContext(PluvContext);

    const createRoomBundle = <TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {}>(
        options: CreateRoomBundleOptions<TIO, TMetadata, TPresence, TStorage, TEvents>,
    ): CreateRoomBundle<TIO, TMetadata, TPresence, TStorage, TEvents> => _createRoomBundle(client, options);

    return {
        createRoomBundle,
        PluvProvider,
        useClient,
    };
};
