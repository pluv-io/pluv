export const pickBy = <T extends Record<string, any>>(
    obj: T,
    by: (value: T[keyof T]) => boolean,
): Partial<T> => {
    const result: Partial<T> = {};
    const keys: (keyof T)[] = Object.keys(obj);

    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const value = obj[key];

        if (by(value)) result[key] = value;
    }

    return result;
};
