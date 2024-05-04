import { useEffect, useState } from "react";

const hasFocus = (): boolean => {
    /**
     * !HACK
     * @description If no document, default to true for SSR purposes
     * @author David Lee
     * @date March 26, 2022
     */
    return typeof document !== "undefined" ? document.hasFocus() || document.visibilityState === "visible" : true;
};

export const useWindowFocus = () => {
    const [focused, setFocused] = useState<boolean>(hasFocus());

    const isBrowser: boolean = typeof window !== "undefined";

    useEffect(() => {
        /**
         * !HACK
         * @description focus for additional renders
         * @author David Lee
         * @date March 26, 2022
         */
        setFocused(hasFocus());

        if (!isBrowser) return;

        const onFocus = () => setFocused(true);
        const onBlur = () => setFocused(false);
        const onVisibilityChange = () => {
            if (typeof document !== "undefined") {
                setFocused(hasFocus());

                return;
            }

            setFocused(true);
        };

        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [isBrowser]);

    return focused;
};
