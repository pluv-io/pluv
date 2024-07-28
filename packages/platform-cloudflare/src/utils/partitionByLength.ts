export const partitionByLength = <T>(arr: readonly T[] | T[], length: number): readonly (readonly T[])[] => {
    if (!arr.length) return [];

    const head = arr.slice(0, length);
    const tail = arr.slice(length);

    return [head, ...partitionByLength(tail, length)];
};
