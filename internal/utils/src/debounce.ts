export const debounce = <TFunc extends (...args: any[]) => any>(
    fn: TFunc,
    options?: { wait: number; immediate?: boolean },
) => {
    const { wait, immediate = false } = options ?? {};

    let timeout: any = null;

    /* eslint-disable func-names */
    return function (...args: Parameters<TFunc>): void {
        /* eslint-enable func-names */

        if (timeout !== null && typeof timeout !== "undefined") clearTimeout(timeout);

        timeout = setTimeout(() => {
            timeout = null;

            if (!immediate) fn(args);
        }, wait);

        if (immediate && !timeout) fn(args);
    };
};
