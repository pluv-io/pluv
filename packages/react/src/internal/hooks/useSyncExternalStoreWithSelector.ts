import { useRef, useSyncExternalStore } from "react";
import { identity } from "../utils";

export const useSyncExternalStoreWithSelector = <TSnapshot, TSelection>(
    subscribe: (onStoreChange: () => void) => () => void,
    getClientSnapshot: () => TSnapshot,
    getServerSnapshot: undefined | null | (() => TSnapshot),
    selector: (snapshot: TSnapshot) => TSelection,
    isEqual?: (a: TSelection, b: TSelection) => boolean,
): TSelection => {
    const cacheRef = useRef<TSelection | null>(null);

    const _getServerSnapshot = getServerSnapshot
        ? () => {
              const data = getServerSnapshot();

              return selector(data);
          }
        : undefined;

    const _getClientSnapshot = () => {
        const data = getClientSnapshot();
        const snapshot = selector(data);
        const compare = isEqual ?? identity;
        const cached = cacheRef.current;

        const isUnchanged = cached === null ? snapshot === null : compare(cached, snapshot);

        /**
         * !HACK
         * @description Memoize only the last snapshot so that we can only rerender on changes
         * @date June 22, 2024
         */
        cacheRef.current = isUnchanged ? cached ?? snapshot : snapshot;

        return cacheRef.current;
    };

    return useSyncExternalStore(subscribe, _getClientSnapshot, _getServerSnapshot);
};
