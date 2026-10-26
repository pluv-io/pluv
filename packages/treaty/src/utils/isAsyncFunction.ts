const asyncFunction = (async () => undefined).constructor;

export const isAsyncFunction = (value: (...args: never[]) => unknown): boolean =>
    value.constructor === asyncFunction;
