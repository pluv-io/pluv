import { useCallback, useEffect, useState } from "react";

export type NoSsrFunction = <TValue, TFallback = null>(
    value: TValue | (() => TValue),
    fallback?: TFallback,
) => TValue | TFallback;

export const useNoSsr = (): NoSsrFunction => {
    const [didMount, setDidMount] = useState<boolean>(false);

    useEffect(() => setDidMount(typeof window !== "undefined"), []);

    const noSsr = useCallback(
        <TValue, TFallback = null>(
            value: TValue | (() => TValue),
            fallback: TFallback = null as TFallback,
        ): TValue | TFallback => {
            return didMount
                ? typeof value !== "function"
                    ? value
                    : (value as () => TValue)()
                : (fallback ?? (null as TFallback));
        },
        [didMount],
    );

    return noSsr;
};
