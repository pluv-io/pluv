import type { PluvClient } from "@pluv/client";
import type { CrdtType } from "@pluv/crdt";
import type { IOLike, JsonObject } from "@pluv/types";
import type { FC, ReactNode } from "react";
import { createContext, memo, useContext } from "react";
import type { CreateRoomBundle, CreateRoomBundleOptions } from "./createRoomBundle";
import { createRoomBundle as _createRoomBundle } from "./createRoomBundle";

export interface PluvProviderProps {
    children?: ReactNode;
}

export interface CreateBundle<TIO extends IOLike, TMetadata extends JsonObject> {
    // factories
    createRoomBundle: <TPresence extends JsonObject = {}, TStorage extends Record<string, CrdtType<any, any>> = {}>(
        options: CreateRoomBundleOptions<TIO, TMetadata, TPresence, TStorage>,
    ) => CreateRoomBundle<TIO, TMetadata, TPresence, TStorage>;

    // components
    PluvProvider: FC<PluvProviderProps>;

    // hooks
    useClient: () => PluvClient<TIO, TMetadata>;
}

export const createBundle = <TIO extends IOLike, TMetadata extends JsonObject>(
    client: PluvClient<TIO, TMetadata>,
): CreateBundle<TIO, TMetadata> => {
    /**
     * !HACK
     * @description We'll let the context error out if client is not provided,
     * and let the users deal with it.
     * @author leedavidcs
     * @date October 27, 2022
     */
    const PluvContext = createContext<PluvClient<TIO, TMetadata>>(null as any);

    const PluvProvider = memo<PluvProviderProps>((props) => {
        const { children } = props;

        return <PluvContext.Provider value={client}>{children}</PluvContext.Provider>;
    });

    PluvProvider.displayName = "PluvProvider";

    const useClient = (): PluvClient<TIO, TMetadata> => useContext(PluvContext);

    const createRoomBundle = <
        TPresence extends JsonObject = {},
        TStorage extends Record<string, CrdtType<any, any>> = {},
    >(
        options: CreateRoomBundleOptions<TIO, TMetadata, TPresence, TStorage>,
    ): CreateRoomBundle<TIO, TMetadata, TPresence, TStorage> => _createRoomBundle(client, options);

    return {
        createRoomBundle,
        PluvProvider,
        useClient,
    };
};
