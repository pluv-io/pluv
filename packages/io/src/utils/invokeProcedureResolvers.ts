export type ProcedureResolverResults =
    | { ok: true; broadcast: unknown; self: unknown }
    | { ok: false; error: unknown };

/**
 * Runs `self` first. A synchronous throw must not start `broadcast`.
 * If `broadcast` throws after `self` returned a promise, that work still runs.
 * The promise stays attached so its rejection is not unhandled.
 */
export const invokeProcedureResolvers = (resolvers: {
    broadcast: () => unknown;
    self: () => unknown;
}): ProcedureResolverResults => {
    let selfResult: unknown;

    try {
        selfResult = resolvers.self();
    } catch (error) {
        return { ok: false, error };
    }

    try {
        return { ok: true, broadcast: resolvers.broadcast(), self: selfResult };
    } catch (error) {
        void Promise.resolve(selfResult).catch(() => undefined);

        return { ok: false, error };
    }
};
