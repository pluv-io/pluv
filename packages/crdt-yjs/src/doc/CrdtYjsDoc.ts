import type { DocApplyEncodedStateParams, DocSubscribeCallbackParams, InferCrdtJson } from "@pluv/crdt";
import { AbstractCrdtDoc } from "@pluv/crdt";
import { fromUint8Array, toUint8Array } from "js-base64";
import {
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
} from "yjs";
import type { YjsType } from "../types";

export class CrdtYjsDoc<TStorage extends Record<string, YjsType<any, any>>> extends AbstractCrdtDoc<TStorage> {
    public value: YDoc = new YDoc();

    private _storage: TStorage;
    private _undoManager: UndoManager | null = null;

    constructor(value: TStorage = {} as TStorage) {
        super();

        this._storage = Object.entries(value).reduce((acc, [key, node]) => {
            if (node instanceof YArray) {
                const yArray = this.value.get(key, YArray) as YArray<any>;

                yArray.insert(0, node.slice(0));

                return { ...acc, [key]: yArray };
            }

            if (node instanceof YMap) {
                const yMap = this.value.get(key, YMap) as YMap<any>;

                Array.from(node.entries()).forEach(([k, v]) => {
                    yMap.set(k.toString(), v);
                });

                return { ...acc, [key]: yMap };
            }

            if (node instanceof YText) {
                const yText = this.value.get(key, YText) as YText;

                yText.insert(0, node.toJSON());

                return { ...acc, [key]: yText };
            }

            if (node instanceof YXmlElement) {
                const yXmlElement = this.value.get(key, YXmlElement) as YXmlElement;

                yXmlElement.insert(0, node.slice(0));

                return { ...acc, [key]: yXmlElement };
            }

            if (node instanceof YXmlFragment) {
                const yXmlFragment = this.value.get(key, YXmlFragment) as YXmlFragment;

                yXmlFragment.insert(0, node.slice(0));

                return { ...acc, [key]: yXmlFragment };
            }

            if (node instanceof YXmlText) {
                const yXmlText = this.value.get(key, YXmlText) as YXmlText;

                return { ...acc, [key]: yXmlText };
            }

            return acc;
        }, {} as TStorage);
    }

    public applyEncodedState(params: DocApplyEncodedStateParams): this {
        const { origin, update } = params;

        if (update === null || typeof update === "undefined") return this;

        const uint8Update = typeof update === "string" ? toUint8Array(update) : update;

        applyUpdate(this.value, uint8Update, origin);

        return this;
    }

    public batchApplyEncodedState(updates: readonly (DocApplyEncodedStateParams | string | null | undefined)[]): this {
        const params = updates.reduce<DocApplyEncodedStateParams[]>((acc, update) => {
            if (!update) return acc;

            if (typeof update === "string") {
                acc.push({ update });

                return acc;
            }

            if (!!update && typeof update === "object") {
                acc.push(update);

                return acc;
            }

            return acc;
        }, []);

        return params.reduce((doc, update) => doc.applyEncodedState(update), this);
    }

    public canRedo(): boolean {
        return !!this._undoManager?.canRedo();
    }

    public canUndo(): boolean {
        return !!this._undoManager?.canUndo();
    }

    public destroy(): void {
        this._undoManager?.destroy();
        this.value.destroy();
    }

    public get(key?: undefined): TStorage;
    public get<TKey extends keyof TStorage>(key: TKey): TStorage[TKey];
    public get<TKey extends keyof TStorage>(key?: TKey): TStorage | TStorage[TKey] {
        if (typeof key === "undefined") return this._storage;

        return this._storage[key as TKey];
    }

    public getEncodedState(): string {
        return fromUint8Array(encodeStateAsUpdate(this.value));
    }

    public isEmpty(): boolean {
        return !this.value.share.size;
    }

    public redo(): this {
        this._undoManager?.redo();

        return this;
    }

    public subscribe(listener: (params: DocSubscribeCallbackParams<TStorage>) => void): () => void {
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
        if (this._undoManager) this._undoManager.destroy();

        const sharedTypes = Object.values(this._storage).reduce<YjsType<any, any>[]>((acc, type) => {
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
        }, []);

        if (!sharedTypes.length) {
            this._undoManager?.destroy();
            this._undoManager = null;

            return this;
        }

        this._undoManager = new UndoManager(sharedTypes, { captureTimeout: 0 });

        return this;
    }

    public transact(fn: () => void): this {
        this.value.transact(fn);

        return this;
    }

    public toJson(): InferCrdtJson<TStorage> {
        return Object.entries(this._storage).reduce(
            (acc, [key, value]) => ({ ...acc, [key]: value.toJSON() }),
            {} as InferCrdtJson<TStorage>,
        );
    }

    public undo(): this {
        this._undoManager?.undo();

        return this;
    }
}
