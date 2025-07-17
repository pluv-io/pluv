import type {
    DocApplyEncodedStateParams,
    DocBatchApplyEncodedStateParams,
    DocSubscribeCallbackParams,
    InferCrdtJson,
} from "@pluv/crdt";
import type { CrdtDocLike } from "@pluv/types";
import { fromUint8Array, toUint8Array } from "js-base64";
import {
    AbstractType,
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
import type { YjsType } from "../types";
import type { YjsBuilder } from "./builder";
import { builder } from "./builder";

const MERGE_INTERVAL_MS = 1_000;
const PLUV_ID_FIELD = "__$pluv";

export type CrdtYjsDocParams<TStorage extends Record<string, YjsType<any, any>>> = (
    builder: YjsBuilder,
) => TStorage;

export class CrdtYjsDoc<TStorage extends Record<string, YjsType<any, any>>>
    implements CrdtDocLike<YDoc, TStorage>
{
    public value: YDoc = new YDoc();

    #_storage: TStorage;
    #_undoManager: UndoManager | null = null;

    constructor(params: CrdtYjsDocParams<TStorage> = () => ({}) as TStorage) {
        const storage = params(builder(this.value));
        const keys = this.value.share.keys().reduce((set, key) => set.add(key), new Set<string>());

        this.#_storage = Object.entries(storage).reduce(
            (acc, [key, node]) => (keys.has(key) ? { ...acc, [key]: node } : acc),
            {} as TStorage,
        );
        if (!!Object.keys(storage).length) this.#_setPluvId();
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

    public get(key?: undefined): TStorage;
    public get<TKey extends keyof TStorage>(type: TKey): TStorage[TKey];
    public get<TKey extends keyof TStorage>(type?: TKey): TStorage | TStorage[TKey] {
        if (typeof type === "undefined") return this.#_storage;

        return this.#_storage[type as TKey];
    }

    public getEncodedState(): string {
        return fromUint8Array(encodeStateAsUpdate(this.value));
    }

    public isEmpty(): boolean {
        return !this.value.share.size;
    }

    public rebuildStorage(reference: TStorage): this {
        const isBuilt = !!Object.keys(this.#_storage).length;

        if (isBuilt) {
            console.warn("Attempted to rebuild storage multiple times");
            return this;
        }

        this.#_storage = Object.entries(reference).reduce((acc, [key, node]) => {
            /**
             * @description It is important that the XML shared-types be checked before the others
             * because they extend off the non-xml types (thereby you can mistakenly identify the
             * wrong type if checked in the reverse order)
             * @date May 9 ,2025
             */
            if (node instanceof YXmlElement) {
                return { ...acc, [key]: this.value.getXmlElement(key) };
            }
            if (node instanceof YXmlFragment) {
                return { ...acc, [key]: this.value.getXmlFragment(key) };
            }
            if (node instanceof YXmlText) return { ...acc, [key]: this.value.get(key, YXmlText) };
            if (node instanceof YArray) return { ...acc, [key]: this.value.getArray(key) };
            if (node instanceof YMap) return { ...acc, [key]: this.value.getMap(key) };
            if (node instanceof YText) return { ...acc, [key]: this.value.getText(key) };

            return acc;
        }, {} as TStorage);

        return this.track();
    }

    public redo(): this {
        this.#_undoManager?.redo();

        return this;
    }

    public subscribe(
        listener: (params: DocSubscribeCallbackParams<YDoc, TStorage>) => void,
    ): () => void {
        const fn = (update: Uint8Array, origin: any, doc: YDoc) => {
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

        const sharedTypes = Object.values(this.#_storage).reduce<YjsType<AbstractType<any>, any>[]>(
            (acc, type) => {
                if (
                    type instanceof YArray ||
                    type instanceof YMap ||
                    type instanceof YText ||
                    type instanceof YXmlElement ||
                    type instanceof YXmlFragment ||
                    type instanceof YXmlText
                ) {
                    acc.push(type as YjsType<AbstractType<any>, any>);
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

    public toJson(): InferCrdtJson<TStorage>;
    public toJson<TKey extends keyof TStorage>(type: TKey): InferCrdtJson<TStorage[TKey]>;
    public toJson<TKey extends keyof TStorage>(type?: TKey) {
        if (typeof type === "string") return this.#_storage[type].toJSON();

        return Object.entries(this.#_storage).reduce(
            (acc, [key, value]) => ({ ...(acc as any), [key]: value.toJSON() }),
            {} as InferCrdtJson<TStorage>,
        );
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
}
