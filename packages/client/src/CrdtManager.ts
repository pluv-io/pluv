import type { AbstractCrdtDocFactory, CrdtDocLike, CrdtType } from "@pluv/crdt";
import { noop } from "@pluv/crdt";

export type CrdtManagerOptions<TStorage extends Record<string, CrdtType<any, any>> = {}> = {
    initialStorage?: AbstractCrdtDocFactory<TStorage>;
};

interface CrdtManagerInitializeParams {
    origin?: any;
    update: string | readonly string[];
}

interface ApplyUpdateParams {
    origin?: any;
    update: string | readonly string[];
}

export class CrdtManager<TStorage extends Record<string, CrdtType<any, any>>> {
    public doc: CrdtDocLike<TStorage>;
    public initialized: boolean = false;

    private readonly _docFactory: AbstractCrdtDocFactory<TStorage>;

    constructor(options: CrdtManagerOptions<TStorage>) {
        const { initialStorage = noop.doc({}) as AbstractCrdtDocFactory<TStorage> } = options;

        this._docFactory = initialStorage;
        this.doc = initialStorage.getEmpty();
    }

    /**
     * !HACK
     * @description If this is called before the doc is initialized. Omit the
     * update. This unfortunately means updates can be dropped entirely
     * @date June 13, 2023
     */
    public applyUpdate(params: ApplyUpdateParams): this {
        const { origin, update } = params;

        if (!this.initialized) return this;

        const updates: readonly string[] = typeof update === "string" ? [update] : update;

        this._applyDocUpdates(this.doc, updates, origin);

        return this;
    }

    public destroy(): void {
        this.initialized = false;
        this.doc.destroy();
        this.doc = this._docFactory.getEmpty();
    }

    public get<TKey extends keyof TStorage>(key: TKey): TStorage[TKey] {
        return this.doc.get(key);
    }

    public getInitialState(): string {
        return this._docFactory.getInitialized().getEncodedState();
    }

    public initialize(params: CrdtManagerInitializeParams): this {
        const { origin, update } = params;

        /**
         * !HACK
         * @description If the doc was already initialized, we don't want to re-initialize
         * the doc and overwrite what's already there. Skip the initialization and log a
         * warning.
         * @date May 7, 2025
         */
        if (this.initialized) {
            console.warn("Attempted to initialize storage multiple times");
            return this;
        }

        /**
         * !HACK
         * @description If the doc is already populated, somehow we're attempting to overwrite
         * a doc that was presumably initialized but not identified as initialized. Skip the
         * initialization and log a warning.
         * @date May 7, 2025
         */
        if (!this.doc.isEmpty()) {
            console.warn("Attempted to initialize over a non-empty storage");
            return this;
        }

        const updates = typeof update === "string" ? [update] : update;

        if (!updates.length) return this;

        const initialized = this._docFactory.getInitialized();
        const reference = initialized.get();

        this.doc = this._applyDocUpdates(
            this._docFactory.getEmpty(),
            updates,
            origin,
        ).rebuildStorage(reference);
        this.initialized = true;
        initialized.destroy();

        return this;
    }

    public resolveEncodedState(updates: string | string[] | readonly string[]): string | null {
        return this._docFactory.resolveEncodedState(updates);
    }

    private _applyDocUpdates(
        doc: CrdtDocLike<TStorage>,
        updates: readonly string[],
        origin?: string,
    ): CrdtDocLike<TStorage> {
        doc.transact(() => {
            doc.batchApplyEncodedState({ origin, updates });
        }, origin);

        return doc;
    }
}
