export const isThenable = (value: unknown): value is PromiseLike<unknown> =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === "function";
