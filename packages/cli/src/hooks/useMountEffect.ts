import { useEffect } from "react";

export const useMountEffect = (effectFn: () => void) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(effectFn, []);
};
