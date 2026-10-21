import type { CrdtDocLike, OperatorUser } from "@pluv/types";

const EDIT_ORIGIN_PREFIX = "$pluv-edit:";
const READ_METHODS = new Set(["get", "slice", "toArray", "toJSON", "toString", "valueOf"]);

export type StorageEditCaller<TUser = { id: string }> = {
    operator: OperatorUser | null;
    procedure: string | null;
    user: TUser | null;
};

const isObject = (value: unknown): value is object => !!value && typeof value === "object";

const bindShared = (
    value: unknown,
    run: <T>(fn: () => T) => T,
    cache: WeakMap<object, unknown>,
): unknown => {
    if (!isObject(value) || Array.isArray(value) || value instanceof Uint8Array) return value;

    const cached = cache.get(value);

    if (cached) return cached;

    const proxy = new Proxy(value, {
        get(target, prop, receiver) {
            if (prop === "doc" || prop === "value") return Reflect.get(target, prop, receiver);

            const child = Reflect.get(target, prop, receiver);

            if (typeof child !== "function") {
                return isObject(child) ? bindShared(child, run, cache) : child;
            }

            return (...args: unknown[]) => {
                const invoke = (): unknown => child.apply(target, args);
                const result =
                    typeof prop === "string" && READ_METHODS.has(prop) ? invoke() : run(invoke);

                return bindShared(result, run, cache);
            };
        },
    });

    cache.set(value, proxy);

    return proxy;
};

/** A document handle closed over one call. Writes through it carry that caller. `.value` does not. */
export const bindStorageEditDoc = <TDoc extends CrdtDocLike>(doc: TDoc, token: string): TDoc => {
    const cache = new WeakMap<object, unknown>();
    let depth = 0;
    const run = <T>(fn: () => T): T => {
        if (depth > 0) return fn();

        depth += 1;

        try {
            let result!: T;

            doc.transact(() => {
                result = fn();
            }, token);

            return result;
        } finally {
            depth -= 1;
        }
    };
    const proxy = new Proxy(doc, {
        get(target, prop, receiver) {
            if (prop === "value") return target.value;

            const child = Reflect.get(target, prop, receiver);

            if (prop === "get" && typeof child === "function") {
                return (...args: unknown[]) => bindShared(child.apply(target, args), run, cache);
            }

            if (prop === "transact") {
                return (fn: () => void) => {
                    run(fn);

                    return proxy;
                };
            }

            if (
                (prop === "applyEncodedState" || prop === "batchApplyEncodedState") &&
                typeof child === "function"
            ) {
                return (params?: { origin?: string }) => {
                    child.call(target, { ...params, origin: token });

                    return proxy;
                };
            }

            if (typeof child !== "function") return child;

            return (...args: unknown[]) => {
                const result = child.apply(target, args);

                return result === target ? proxy : result;
            };
        },
    });

    return proxy as TDoc;
};

/** Callers for in-flight document handles. The origin on the edit finds the caller. */
export class StorageEditCalls<TUser = { id: string }> {
    private _callers = new Map<string, StorageEditCaller<TUser>>();
    private _seq = 0;

    public caller(origin: string | null): StorageEditCaller<TUser> | null {
        if (!origin?.startsWith(EDIT_ORIGIN_PREFIX)) return null;

        return this._callers.get(origin) ?? null;
    }

    public open(
        doc: CrdtDocLike,
        caller: StorageEditCaller<TUser>,
    ): { close: () => void; doc: CrdtDocLike } {
        const token = `${EDIT_ORIGIN_PREFIX}${++this._seq}`;

        this._callers.set(token, caller);

        return {
            close: () => {
                queueMicrotask(() => {
                    this._callers.delete(token);
                });
            },
            doc: bindStorageEditDoc(doc, token),
        };
    }
}
