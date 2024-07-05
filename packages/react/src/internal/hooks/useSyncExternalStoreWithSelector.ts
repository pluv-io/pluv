import { useRef, useSyncExternalStore } from "react";
import { shallowEqual } from "../utils";
import { useNoSsr } from "./useNoSsr";

export const useSyncExternalStoreWithSelector = <TSnapshot, TSelection>(
    subscribe: (onStoreChange: () => void) => () => void,
    getClientSnapshot: () => TSnapshot,
    getServerSnapshot: undefined | null | (() => TSnapshot),
    selector: (snapshot: TSnapshot) => TSelection,
    isEqual?: (a: TSelection, b: TSelection) => boolean,
): TSelection => {
    const noSsr = useNoSsr();
    const cacheRef = useRef<TSelection | null>(null);

    const _getServerSnapshot = getServerSnapshot
        ? () => {
              const data = getServerSnapshot();
              const snapshot = selector(data);
              const compare = isEqual ?? shallowEqual;
              const cached = cacheRef.current;

              const isUnchanged = cached === null ? snapshot === null : compare(cached, snapshot);

              /**
               * !HACK
               * @description Memoize only the last snapshot so that we can only rerender on changes
               * @date June 22, 2024
               */
              cacheRef.current = isUnchanged ? cached ?? snapshot : snapshot;

              return cacheRef.current;
          }
        : undefined;

    const _getClientSnapshot = () => {
        const data = getClientSnapshot();
        const snapshot = selector(data);
        const compare = isEqual ?? shallowEqual;
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

    const result = useSyncExternalStore(subscribe, _getClientSnapshot, _getServerSnapshot);

    return typeof window !== "undefined" ? noSsr(result, _getServerSnapshot?.()) : result;
};
