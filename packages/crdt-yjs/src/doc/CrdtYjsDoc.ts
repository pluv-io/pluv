import type {
    DocApplyEncodedStateParams,
    DocBatchApplyEncodedStateParams,
    DocSubscribeCallbackParams,
} from "@pluv/crdt";
import type { CrdtDocLike } from "@pluv/types";
import { fromUint8Array, toUint8Array } from "js-base64";
import {
    AbstractType,
    ContentEmbed,
    ContentFormat,
    ContentString,
    UndoManager,
    Array as YArray,
    Doc as YDoc,
    Map as YMap,
    Text as YText,
    XmlElement as YXmlElement,
    XmlFragment as YXmlFragment,
    XmlText as YXmlText,
    applyUpdate,
    encodeStateAsUpdate,
    mergeUpdates,
} from "yjs";
import { getYjsShare, hydrateTopLevel } from "../schema/hydrate";
import type { InferYjsJson, InferYjsStorage, YjsSchema } from "../schema/schema";

const MERGE_INTERVAL_MS = 1_000;
const PLUV_ID_FIELD = "__$pluv";

export class CrdtYjsDoc<TSchema extends YjsSchema = YjsSchema> implements CrdtDocLike<
    YDoc,
    InferYjsStorage<TSchema>,
    InferYjsJson<TSchema>
> {
    public value: YDoc = new YDoc();

    #_schema: TSchema;
    #_storage: InferYjsStorage<TSchema>;
    #_undoManager: UndoManager | null = null;

    constructor(schema: TSchema, seed?: Record<string, unknown>, hydrate: boolean = false) {
        this.#_schema = schema;

        if (hydrate) {
            this.#_storage = hydrateTopLevel(this.value, schema, seed) as InferYjsStorage<TSchema>;
            if (Object.keys(schema.shape).length) this.#_setPluvId();
        } else {
            this.#_storage = {} as InferYjsStorage<TSchema>;
        }
    }

    public applyEncodedState(params: DocApplyEncodedStateParams): this {
        const { origin, update } = params;

        if (update === null || typeof update === "undefined") return this;

        const uint8Update = typeof update === "string" ? toUint8Array(update) : update;

        applyUpdate(this.value, uint8Update, origin);

        return this;
    }

    public batchApplyEncodedState(params: DocBatchApplyEncodedStateParams): this {
        const { origin } = params;
        const updates = params.updates ?? [];

        const filtered = updates.reduce<Uint8Array[]>((acc, update) => {
            if (!update) return acc;

            if (typeof update === "string") {
                acc.push(toUint8Array(update));
                return acc;
            }

            if (typeof update === "object") {
                acc.push(update);
                return acc;
            }

            return acc;
        }, []);

        if (!filtered.length) return this;

        const merged = mergeUpdates(filtered);

        return this.applyEncodedState({ origin, update: merged });
    }

    public canRedo(): boolean {
        return !!this.#_undoManager?.canRedo();
    }

    public canUndo(): boolean {
        return !!this.#_undoManager?.canUndo();
    }

    public destroy(): void {
        this.#_undoManager?.destroy();
        this.value.destroy();
    }

    public get(key?: undefined): InferYjsStorage<TSchema>;
    public get<TKey extends keyof InferYjsStorage<TSchema>>(
        type: TKey,
    ): InferYjsStorage<TSchema>[TKey];
    public get<TKey extends keyof InferYjsStorage<TSchema>>(
        type?: TKey,
    ): InferYjsStorage<TSchema> | InferYjsStorage<TSchema>[TKey] {
        if (typeof type === "undefined") return this.#_storage;

        return this.#_storage[type as TKey];
    }

    public getEncodedState(): string {
        return fromUint8Array(encodeStateAsUpdate(this.value));
    }

    public isDirty(): boolean {
        return !!this.value.store.clients.size;
    }

    public isEmpty(): boolean {
        return !this.value.share.size;
    }

    public rebuildStorage(): this {
        const isBuilt = !!Object.keys(this.#_storage).length;

        if (isBuilt) {
            console.warn("Attempted to rebuild storage multiple times");
            return this;
        }

        this.#_storage = Object.entries(this.#_schema.shape).reduce((acc, [key, node]) => {
            Object.assign(acc, { [key]: getYjsShare(this.value, key, node.kind) });
            return acc;
        }, {} as InferYjsStorage<TSchema>);

        return this.track();
    }

    public redo(): this {
        this.#_undoManager?.redo();

        return this;
    }

    public subscribe(
        listener: (
            params: DocSubscribeCallbackParams<
                YDoc,
                InferYjsStorage<TSchema>,
                InferYjsJson<TSchema>
            >,
        ) => void,
    ): () => void {
        const fn = (update: Uint8Array, origin: any, _doc: YDoc) => {
            listener({
                doc: this,
                local: origin === null || typeof origin === "undefined",
                origin: origin ? String(origin) : null,
                update: fromUint8Array(update),
            });
        };

        this.value.on("update", fn);

        return () => {
            this.value.off("update", fn);
        };
    }

    public track(): this {
        if (this.#_undoManager) this.#_undoManager.destroy();

        const sharedTypes = Object.values(this.#_storage).reduce<AbstractType<any>[]>(
            (acc, type) => {
                if (
                    type instanceof YArray ||
                    type instanceof YMap ||
                    type instanceof YText ||
                    type instanceof YXmlElement ||
                    type instanceof YXmlFragment ||
                    type instanceof YXmlText
                ) {
                    acc.push(type);
                }

                return acc;
            },
            [],
        );

        if (!sharedTypes.length) {
            this.#_undoManager?.destroy();
            this.#_undoManager = null;

            return this;
        }

        this.#_undoManager = new UndoManager(sharedTypes, { captureTimeout: MERGE_INTERVAL_MS });

        return this;
    }

    public transact(fn: () => void): this {
        this.value.transact(fn);

        return this;
    }

    public toJson(): InferYjsJson<TSchema>;
    public toJson<TKey extends keyof InferYjsJson<TSchema>>(
        type: TKey,
    ): InferYjsJson<TSchema>[TKey];
    public toJson<TKey extends keyof InferYjsJson<TSchema>>(type?: TKey) {
        if (typeof type === "string") {
            const shared = this.#_storage[type];

            if (shared && typeof (shared as { toJSON?: () => unknown }).toJSON === "function") {
                return (shared as { toJSON: () => unknown }).toJSON();
            }

            const fromDoc = this.value.share.get(type);

            return (this.#_toJsonFromShare(type, fromDoc) ?? null) as InferYjsJson<TSchema>[TKey];
        }

        return this.#_toJsonFromDoc();
    }

    public undo(): this {
        this.#_undoManager?.undo();

        return this;
    }

    #_setPluvId() {
        const text = this.value.getText(PLUV_ID_FIELD);
        const id = typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString();

        text.insert(0, id);
    }

    #_toJsonFromDoc(): InferYjsJson<TSchema> {
        const json = {} as InferYjsJson<TSchema>;

        this.value.share.forEach((sharedType, key) => {
            if (key === PLUV_ID_FIELD) return;

            Object.assign(json, { [key]: this.#_toJsonFromShare(key, sharedType) });
        });

        return json;
    }

    #_toJsonFromShare(key: string, sharedType: AbstractType<any> | undefined): unknown {
        if (!sharedType) return null;

        if (
            sharedType instanceof YXmlElement ||
            sharedType instanceof YXmlFragment ||
            sharedType instanceof YXmlText ||
            sharedType instanceof YText ||
            sharedType instanceof YArray ||
            sharedType instanceof YMap
        ) {
            return sharedType.toJSON();
        }

        const start = (
            sharedType as AbstractType<any> & {
                _start?: { content?: object } | null;
                _map?: Map<string, unknown>;
            }
        )._start;
        const map = (
            sharedType as AbstractType<any> & {
                _map?: Map<string, unknown>;
            }
        )._map;
        const content = start?.content ?? null;

        if (
            content instanceof ContentString ||
            content instanceof ContentEmbed ||
            content instanceof ContentFormat
        ) {
            return this.value.getText(key).toJSON();
        }

        if (map && map.size > 0 && start) {
            return this.value.getXmlElement(key).toJSON();
        }

        if (start) {
            return this.value.getArray(key).toJSON();
        }

        if (map && map.size > 0) {
            return this.value.getMap(key).toJSON();
        }

        return {};
    }
}
