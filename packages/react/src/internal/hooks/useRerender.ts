import { useCallback, useState } from "react";

export const useRerender = (): (() => void) => {
    const [, setCount] = useState(0);

    return useCallback(() => {
        setCount((oldCount) => (oldCount + 1) % Number.MAX_SAFE_INTEGER);
    }, []);
};
