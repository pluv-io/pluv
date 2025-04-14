import { useEffect } from "react";

export const useMountEffect = (effectFn: () => void) => {
    useEffect(effectFn, []);
};
