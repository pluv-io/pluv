export type WorkerCode = {
    compatibilityDate: string;
    /** `null` keeps the uploaded module off the parent's fetch. */
    globalOutbound?: Fetcher | null;
    mainModule: string;
    modules: Record<string, string>;
    env?: Record<string, unknown>;
};

export type WorkerLoader = {
    get: (
        id: string,
        getCode: () => WorkerCode,
    ) => {
        getDurableObjectClass: (name: string) => unknown;
    };
};

export type FacetParent = {
    facets: {
        get: (name: string, getStartupOptions: () => Promise<{ class: unknown }>) => unknown;
    };
};

export type LoadUserFacetOptions = {
    version: string;
    code: () => WorkerCode;
};

/**
 * Starts the user room facet on the first call. The id is omitted so the facet
 * inherits the parent Durable Object id. `loader.get` is keyed by the module version.
 */
export const loadUserFacet = (
    ctx: FacetParent,
    loader: WorkerLoader,
    options: LoadUserFacetOptions,
): unknown => {
    return ctx.facets.get("user", async () => {
        const worker = loader.get(options.version, options.code);

        return { class: worker.getDurableObjectClass("UserRoomFacet") };
    });
};
