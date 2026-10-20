const PROMISE_TRAP_KEYS = new Set(["then", "catch", "finally"]);

export const createHostTreatyProcedureProxy = <
    TInvoke extends (name: string, data: unknown) => Promise<void>,
>(
    invoke: TInvoke,
): TInvoke => {
    return new Proxy(invoke, {
        get(target, prop, receiver) {
            if (typeof prop !== "string" || PROMISE_TRAP_KEYS.has(prop)) {
                return Reflect.get(target, prop, receiver);
            }

            return (data: unknown) => target(prop, data);
        },
    });
};
