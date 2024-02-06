import type { AbstractCrdtDoc, AbstractCrdtType } from "@pluv/crdt";

export type CrdtManagerOptions<
    TStorage extends Record<string, AbstractCrdtType<any, any>> = {},
> = {
    encodedState?: string | Uint8Array | null;
    initialStorage: AbstractCrdtDoc<TStorage>;
};

type CrdtManagerInitializeParams = {
    onInitialized?: () => void;
    origin?: any;
    update: string | readonly string[];
};

export class CrdtManager<
    TStorage extends Record<string, AbstractCrdtType<any, any>>,
> {
    public doc: AbstractCrdtDoc<TStorage>;
    public initialized: boolean = false;

    private readonly _initialStorage: AbstractCrdtDoc<TStorage>;

    constructor(options: CrdtManagerOptions<TStorage>) {
        const { encodedState, initialStorage } = options;

        this._initialStorage = initialStorage;

        this.doc = encodedState
            ? initialStorage.fresh().applyEncodedState({ update: encodedState })
            : initialStorage.fresh();
    }

    /**
     * !HACK
     * @description If this is called before the doc is initialized. Omit the
     * update. This unfortunately means updates can be dropped entirely
     * @date June 13, 2023
     */
    public applyUpdate(update: string | readonly string[], origin?: any): this {
        if (!this.initialized) return this;

        const updates: readonly string[] =
            typeof update === "string" ? [update] : update;

        this._applyDocUpdates(this.doc, updates, origin);

        return this;
    }

    public destroy(): void {
        this.doc.destroy();
    }

    public get<TKey extends keyof TStorage>(key: TKey): TStorage[TKey] {
        return this.doc.get(key);
    }

    public initialize(params: CrdtManagerInitializeParams): this {
        const { onInitialized, origin, update } = params;

        const updates = typeof update === "string" ? [update] : update;

        if (!updates.length) return this;

        this.doc = this._applyDocUpdates(
            this.initialized ? this.doc : this.doc.fresh(),
            updates,
            origin,
        );

        if (!this.initialized && this.doc.isEmpty()) {
            this.doc.destroy();
            this.doc = this._initialStorage;
        }

        this.initialized = true;

        onInitialized?.();

        return this;
    }

    private _applyDocUpdates(
        doc: AbstractCrdtDoc<TStorage>,
        updates: readonly string[],
        origin?: string,
    ): AbstractCrdtDoc<TStorage> {
        doc.transact(() => {
            doc.batchApplyEncodedState(
                updates.map((update) => ({ origin, update })),
            );
        }, origin);

        return doc;
    }
}
