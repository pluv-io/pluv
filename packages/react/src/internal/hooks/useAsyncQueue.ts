import { useCallback, useMemo, useRef } from "react";

/**
 * @description This is to handle race conditions, so that our async operations that can
 * happen between re-renders will happen sequentially.
 * @date April 13, 2025
 */
export const useAsyncQueue = () => {
    const queueRef = useRef<Promise<void>>(Promise.resolve(undefined));

    const push = useCallback(async (promise: Promise<void>) => {
        queueRef.current = queueRef.current.then(async () => await promise);

        return await queueRef.current;
    }, []);

    return useMemo(() => ({ push }), [push]);
};
