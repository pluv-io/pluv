import { useSyncExternalStoreWithSelector } from "./useSyncExternalStoreWithSelector";
import { identity } from "../utils";

export const useSyncExternalStore = <TSnapshot extends unknown>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => TSnapshot,
    getServerSnapshot: undefined | null | (() => TSnapshot)
) => {
    return useSyncExternalStoreWithSelector(
        subscribe,
        getSnapshot,
        getServerSnapshot,
        identity
    );
};
