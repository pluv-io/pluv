export const shallowArrayEqual = <T extends unknown>(
    a: readonly T[] | T[],
    b: readonly T[] | T[],
): boolean => {
    return a.length === b.length && a.every((item, i) => item === b[i]);
};
