import type { TrackOriginOptions, YjsDoc } from "@pluv/crdt-yjs";
import { doc } from "@pluv/crdt-yjs";
import type { AbstractType } from "yjs";

export type CrdtManagerOptions<
    TStorage extends Record<string, AbstractType<any>> = {},
> = {
    encodedState?: string | Uint8Array | null;
    initialStorage?: () => TStorage;
} & TrackOriginOptions;

type CrdtManagerInitializeParams = {
    onInitialized?: () => void;
    origin?: any;
    update: string | readonly string[];
} & TrackOriginOptions;

export class CrdtManager<TStorage extends Record<string, AbstractType<any>>> {
    public doc: YjsDoc<TStorage>;
    public initialized: boolean = false;

    constructor(options: CrdtManagerOptions<TStorage> = {}) {
        const {
            captureTimeout,
            encodedState,
            initialStorage,
            trackedOrigins = [],
        } = options;

        const _doc = encodedState
            ? doc<TStorage>().applyUpdate(encodedState)
            : null;

        if (_doc && !!Object.keys(_doc.toJSON()).length) {
            this.doc = _doc;
            this.trackOrigins({ captureTimeout, trackedOrigins });

            return;
        }

        _doc?.destroy();

        this.doc = doc<TStorage>(initialStorage?.());
        this.trackOrigins({ captureTimeout, trackedOrigins });
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
        const {
            captureTimeout,
            onInitialized,
            origin,
            trackedOrigins,
            update,
        } = params;

        const updates = typeof update === "string" ? [update] : update;

        this.trackOrigins({ captureTimeout, trackedOrigins });

        if (!updates.length) return this;

        if (this.initialized) {
            this._applyDocUpdates(this.doc, updates, origin);

            return this;
        }

        const _doc = this._applyDocUpdates(doc<TStorage>(), updates, origin);

        this.initialized = true;

        if (!!Object.keys(_doc.toJSON()).length) {
            this.doc = _doc;
        } else {
            _doc.destroy();
        }

        onInitialized?.();

        this.trackOrigins({ captureTimeout, trackedOrigins });

        return this;
    }

    public trackOrigins(options: TrackOriginOptions): void {
        const { captureTimeout, trackedOrigins } = options;

        this.doc.trackOrigins({ captureTimeout, trackedOrigins });
    }

    private _applyDocUpdates(
        yjsDoc: YjsDoc<TStorage>,
        updates: readonly string[],
        origin?: string,
    ): YjsDoc<TStorage> {
        yjsDoc.transact(() => {
            updates.reduce((acc, _update) => acc.applyUpdate(_update), yjsDoc);
        }, origin);

        return yjsDoc;
    }
}
