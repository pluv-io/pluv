export const get = <TResult>(
    obj: Record<string, any>,
    path: string,
): TResult | undefined => {
    const travel = (regexp: RegExp) =>
        String.prototype.split
            .call(path, regexp)
            .filter(Boolean)
            .reduce(
                (res, key) =>
                    res !== null && res !== undefined ? res[key] : res,
                obj,
            );

    const result = (travel(/[,[\]]+?/) || travel(/[,[\].]+?/)) as TResult;

    return result === undefined || result === obj ? undefined : result;
};
