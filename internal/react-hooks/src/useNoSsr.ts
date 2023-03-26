import { useCallback, useEffect, useState } from "react";

export type NoSsrFunction = <T>(value: T | (() => T), fallback?: T) => T | null;

export const useNoSsr = (): NoSsrFunction => {
    const [didMount, setDidMount] = useState<boolean>(false);

    useEffect(() => setDidMount(typeof window !== "undefined"), []);

    const noSsr = useCallback(
        <T>(value: T | (() => T), fallback?: T): T | null => {
            return didMount
                ? typeof value !== "function"
                    ? value
                    : (value as () => T)()
                : fallback ?? null;
        },
        [didMount]
    );

    return noSsr;
};
