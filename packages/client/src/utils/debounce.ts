export const debounce = <TFunc extends (...args: any[]) => any>(
    fn: TFunc,
    options?: { wait: number; immediate?: boolean }
): ((...args: Parameters<TFunc>) => void) => {
    const { wait, immediate = false } = options ?? {};

    let prevResult: ReturnType<TFunc> | undefined;
    let timeout: number | null = null;

    return (...args: Parameters<TFunc>): void => {
        if (typeof timeout === "number") clearTimeout(timeout);

        timeout = setTimeout(() => {
            timeout = null;

            if (!immediate) prevResult = fn(args);
        }, wait) as number;

        if (immediate && !timeout) {
            fn(args);

            return;
        }

        return prevResult;
    };
};
