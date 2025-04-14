import { useEffect, useRef, useState } from "react";
import fastDeepEqual from "fast-deep-equal";

export type UseDeepAsyncMemoResult<T extends unknown> =
    | {
          error: null;
          isInitialized: true;
          isLoading: false;
          value: T;
      }
    | {
          error: null;
          isInitialized: boolean;
          value: undefined;
          isLoading: true;
      }
    | {
          error: Error;
          isInitialized: boolean;
          value: undefined;
          isLoading: false;
      };

export const useDeepAsyncMemo = <T>(
    factory: () => Promise<T>,
    isEqual: (a: T, b: T) => boolean = fastDeepEqual,
): UseDeepAsyncMemoResult<T> => {
    // Store the current async state (loading, value, error, etc.)
    const [state, setState] = useState<UseDeepAsyncMemoResult<T>>({
        isInitialized: false,
        isLoading: true,
        value: undefined,
        error: null,
    });

    // Keep track of the last resolved value to compare with new ones
    const lastValueRef = useRef<T | undefined>(undefined);
    const hasValueRef = useRef(false); // Tracks whether we've ever resolved a value

    // Tracks the current in-flight promise to guard against race conditions
    const inflightRef = useRef<Promise<T> | null>(null);

    // Used to prevent state updates after the component unmounts
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;

        // Trigger the async factory
        const promise = factory();
        inflightRef.current = promise;

        // Set loading state
        setState((prev) => {
            return {
                ...prev,
                isLoading: true,
                error: null,
            } as UseDeepAsyncMemoResult<T>;
        });

        promise
            .then((result) => {
                // Ignore if component unmounted or if this promise is stale
                if (!isMountedRef.current || inflightRef.current !== promise) return;

                // Skip update if value hasn't changed
                const isSame = hasValueRef.current && isEqual(lastValueRef.current as T, result);
                if (isSame) {
                    setState((prev) => {
                        return {
                            ...prev,
                            isInitialized: true,
                            isLoading: false,
                        } as UseDeepAsyncMemoResult<T>;
                    });
                    return;
                }

                // Save the new value
                lastValueRef.current = result;
                hasValueRef.current = true;

                setState({
                    isInitialized: true,
                    isLoading: false,
                    value: result,
                    error: null,
                });
            })
            .catch((err) => {
                // Ignore if component unmounted or if this promise is stale
                if (!isMountedRef.current || inflightRef.current !== promise) return;

                setState({
                    isInitialized: hasValueRef.current,
                    isLoading: false,
                    value: undefined,
                    error: err instanceof Error ? err : new Error("Unknown error"),
                });
            });

        // Cleanup: prevent state updates after unmount
        return () => {
            isMountedRef.current = false;
        };
    }, [factory, isEqual]);

    return state;
};
