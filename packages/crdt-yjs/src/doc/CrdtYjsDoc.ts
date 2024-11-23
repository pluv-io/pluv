import type { DocApplyEncodedStateParams, DocSubscribeCallbackParams, InferCrdtJson } from "@pluv/crdt";
import { AbstractCrdtDoc } from "@pluv/crdt";
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
} from "yjs";
import { YjsArray } from "../array/YjsArray";
import { YjsMap } from "../map/YjsMap";
import { YjsObject } from "../object/YjsObject";
import { YjsText } from "../text/YjsText";
import type { YjsType } from "../types";
import { YjsXmlElement } from "../xmlElement/YjsXmlElement";
import { YjsXmlText } from "../xmlText/YjsXmlText";

export class CrdtYjsDoc<TStorage extends Record<string, YjsType<any, any>>> extends AbstractCrdtDoc<TStorage> {
    public value: YDoc = new YDoc();

    private _decoder = new TextDecoder();
    private _encoder = new TextEncoder();
    private _storage: TStorage;
    private _undoManager: UndoManager | null = null;

    constructor(value: TStorage = {} as TStorage) {
        super();

        this._storage = Object.entries(value).reduce((acc, [key, node]) => {
            if (node instanceof YjsArray) {
                const yArray = this.value.getArray(key);

                !!node.initialValue?.length && yArray.insert(0, node.initialValue?.slice(0));

                return { ...acc, [key]: yArray };
            }

            if (node instanceof YjsMap) {
                const yMap = this.value.getMap(key);

                (node.initialValue ?? []).forEach(([k, v]) => {
                    yMap.set(k.toString(), v);
                });

                return { ...acc, [key]: yMap };
            }

            if (node instanceof YjsObject) {
                const yMap = this.value.getMap(key);

                Object.entries(node.initialValue ?? {}).forEach(([k, v]) => {
                    yMap.set(k.toString(), v);
                });

                return { ...acc, [key]: yMap };
            }

            if (node instanceof YjsText) {
                const yText = this.value.getText(key);

                typeof node.initialValue === "string" && yText.insert(0, node.initialValue);

                return { ...acc, [key]: yText };
            }

            if (node instanceof YjsXmlElement) {
                const yXmlElement = this.value.getXmlElement(key);

                !!node.initialValue?.length && yXmlElement.insert(0, node.initialValue?.slice(0));

                return { ...acc, [key]: yXmlElement };
            }

            if (node instanceof YXmlFragment) {
                const yXmlFragment = this.value.getXmlFragment(key);

                !!node.initialValue?.length && yXmlFragment.insert(0, node.initialValue?.slice(0));

                return { ...acc, [key]: yXmlFragment };
            }

            if (node instanceof YjsXmlText) {
                const yXmlText = this.value.get(key, YXmlText) as YXmlText;

                return { ...acc, [key]: yXmlText };
            }

            return acc;
        }, {} as TStorage);
    }

    public applyEncodedState(params: DocApplyEncodedStateParams): this {
        const { origin, update } = params;

        if (update === null || typeof update === "undefined") return this;

        const uint8Update = typeof update === "string" ? this._encoder.encode(update) : update;

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
    public get<TKey extends keyof TStorage>(type: TKey): TStorage[TKey];
    public get<TKey extends keyof TStorage>(type?: TKey): TStorage | TStorage[TKey] {
        if (typeof type === "undefined") return this._storage;

        return this._storage[type as TKey];
    }

    public getEncodedState(): string {
        return this._decoder.decode(encodeStateAsUpdate(this.value));
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
                update: this._decoder.decode(update),
            });
        };

        this.value.on("update", fn);

        return () => {
            this.value.off("update", fn);
        };
    }

    public track(): this {
        if (this._undoManager) this._undoManager.destroy();

        const sharedTypes = Object.values(this._storage).reduce<YjsType<AbstractType<any>, any>[]>((acc, type) => {
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

    public toJson(): InferCrdtJson<TStorage>;
    public toJson<TKey extends keyof TStorage>(type: TKey): InferCrdtJson<TStorage[TKey]>;
    public toJson<TKey extends keyof TStorage>(type?: TKey) {
        if (typeof type === "string") return this._storage[type].toJSON();

        return Object.entries(this._storage).reduce(
            (acc, [key, value]) => ({ ...(acc as any), [key]: value.toJSON() }),
            {} as InferCrdtJson<TStorage>,
        );
    }

    public undo(): this {
        this._undoManager?.undo();

        return this;
    }
}
