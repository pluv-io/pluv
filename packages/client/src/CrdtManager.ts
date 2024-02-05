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

    constructor(options: CrdtManagerOptions<TStorage>) {
        const { encodedState, initialStorage } = options;

        const _doc = encodedState
            ? initialStorage.fresh().applyEncodedState({ update: encodedState })
            : null;

        if (_doc && !!Object.keys(_doc.toJson()).length) {
            this.doc = _doc;
            this.track();

            return;
        }

        _doc?.destroy();

        this.doc = initialStorage;
        this.track();
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

        this.track();

        if (!updates.length) return this;

        if (this.initialized) {
            this._applyDocUpdates(this.doc, updates, origin);

            return this;
        }

        const _doc = this._applyDocUpdates(this.doc.fresh(), updates, origin);

        this.initialized = true;

        if (!!Object.keys(_doc.toJson()).length) {
            this.doc = _doc;
        } else {
            _doc.destroy();
        }

        onInitialized?.();

        this.track();

        return this;
    }

    public track(): void {
        this.doc.track();
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
