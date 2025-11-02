import { useCallback, useEffect, useState } from "react";

export type NoSsrFunction = <T = null>(value: T | (() => T), fallback?: T) => T;

export const useNoSsr = (): NoSsrFunction => {
    const [didMount, setDidMount] = useState<boolean>(false);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setDidMount(typeof window !== "undefined"), []);

    const noSsr = useCallback(
        <T = null>(value: T | (() => T), fallback: T = null as T): T => {
            return didMount
                ? typeof value !== "function"
                    ? value
                    : (value as () => T)()
                : fallback;
        },
        [didMount],
    );

    return noSsr;
};
