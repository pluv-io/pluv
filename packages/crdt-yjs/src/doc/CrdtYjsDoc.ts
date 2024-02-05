import type {
    AbstractCrdtType,
    DocApplyEncodedStateParams,
    DocSubscribeCallbackParams,
    InferCrdtStorageJson,
} from "@pluv/crdt";
import { AbstractCrdtDoc } from "@pluv/crdt";
import { fromUint8Array, toUint8Array } from "js-base64";
import {
    UndoManager,
    AbstractType as YAbstractType,
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
import { CrdtYjsArray } from "../array/CrdtYjsArray";
import { CrdtYjsMap } from "../map/CrdtYjsMap";
import { CrdtYjsObject } from "../object/CrdtYjsObject";
import { CrdtYjsText } from "../text/CrdtYjsText";
import { CrdtYjsXmlElement } from "../xmlElement/CrdtYjsXmlElement";
import { CrdtYjsXmlFragment } from "../xmlFragment/CrdtYjsXmlFragment";
import { CrdtYjsXmlText } from "../xmlText/CrdtYjsXmlText";

export class CrdtYjsDoc<
    TStorage extends Record<string, AbstractCrdtType<any>>,
> extends AbstractCrdtDoc<TStorage> {
    public value: YDoc = new YDoc();

    private _storage: TStorage;
    private _undoManager: UndoManager | null = null;

    constructor(value: TStorage = {} as TStorage) {
        super();

        this._storage = Object.entries(value).reduce((acc, [key, node]) => {
            console.log("node", node);

            if (node instanceof CrdtYjsArray) {
                const yArray = this.value.get(key, YArray) as YArray<any>;
                yArray.insert(0, node.value.slice(0));

                node.value = yArray;

                return { ...acc, [key]: node };
            }

            if (node instanceof CrdtYjsMap || node instanceof CrdtYjsObject) {
                const yMap = this.value.get(key, YMap) as YMap<any>;
                Array.from(node.value.entries()).forEach(([k, v]) => {
                    yMap.set(k, v);
                });

                node.value = yMap;

                return { ...acc, [key]: node };
            }

            if (node instanceof CrdtYjsText) {
                const yText = this.value.get(key, YText) as YText;
                yText.insert(0, node.value.toJSON());

                node.value = yText;

                return { ...acc, [key]: node };
            }

            if (node instanceof CrdtYjsXmlElement) {
                const yXmlElement = this.value.get(
                    key,
                    YXmlElement,
                ) as YXmlElement;
                yXmlElement.insert(0, node.value.slice(0));

                node.value = yXmlElement;

                return { ...acc, [key]: node };
            }

            if (node instanceof CrdtYjsXmlFragment) {
                const yXmlFragment = this.value.get(
                    key,
                    YXmlFragment,
                ) as YXmlFragment;
                yXmlFragment.insert(0, node.value.slice(0));

                node.value = yXmlFragment;

                return { ...acc, [key]: node };
            }

            if (node instanceof CrdtYjsXmlText) {
                const yXmlText = this.value.get(key, YXmlText) as YXmlText;
                yXmlText.insert(0, node.value.toJSON());

                node.value = yXmlText;

                return { ...acc, [key]: node };
            }

            return acc;
        }, {} as TStorage);

        console.log("storage", this._storage);
    }

    public applyEncodedState(params: DocApplyEncodedStateParams): this {
        const { origin, update } = params;

        if (update === null || typeof update === "undefined") return this;

        const uint8Update =
            typeof update === "string" ? toUint8Array(update) : update;

        applyUpdate(this.value, uint8Update, origin);

        return this;
    }

    public batchApplyEncodedState(
        updates: readonly (
            | DocApplyEncodedStateParams
            | string
            | null
            | undefined
        )[],
    ): this {
        const params = updates.reduce<DocApplyEncodedStateParams[]>(
            (acc, update) => {
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
            },
            [],
        );

        return params.reduce(
            (doc, update) => doc.applyEncodedState(update),
            this,
        );
    }

    public canRedo(): boolean {
        return !!this._undoManager?.canRedo();
    }

    public canUndo(): boolean {
        return !!this._undoManager?.canRedo();
    }

    public destroy(): void {
        this._undoManager?.destroy();
        this.value.destroy();
    }

    public fresh(): CrdtYjsDoc<TStorage> {
        return new CrdtYjsDoc<TStorage>();
    }

    public get(key?: undefined): TStorage;
    public get<TKey extends keyof TStorage>(key: TKey): TStorage[TKey];
    public get<TKey extends keyof TStorage>(
        key?: TKey,
    ): TStorage | TStorage[TKey] {
        if (typeof key === "undefined") return this._storage;

        return this._storage[key as TKey];
    }

    public getEncodedState(): string {
        return fromUint8Array(encodeStateAsUpdate(this.value));
    }

    public redo(): this {
        this._undoManager?.redo();

        return this;
    }

    public subscribe(
        listener: (params: DocSubscribeCallbackParams<TStorage>) => void,
    ): () => void {
        const fn = (update: Uint8Array, origin: any, doc: YDoc) => {
            listener({
                doc: this,
                local: origin === null || typeof origin === "undefined",
                origin: String(origin),
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

        const sharedTypes = Object.values(this._storage).reduce<
            YAbstractType<any>[]
        >((acc, type) => {
            if (
                type instanceof CrdtYjsArray ||
                type instanceof CrdtYjsMap ||
                type instanceof CrdtYjsObject ||
                type instanceof CrdtYjsText ||
                type instanceof CrdtYjsXmlElement ||
                type instanceof CrdtYjsXmlFragment ||
                type instanceof CrdtYjsXmlText
            ) {
                acc.push(type.value);
            }

            return acc;
        }, []);

        this._undoManager = new UndoManager(sharedTypes, { captureTimeout: 0 });

        return this;
    }

    public transact(fn: () => void): this {
        this.value.transact(fn);

        return this;
    }

    public toJson(): InferCrdtStorageJson<TStorage> {
        return Object.entries(this._storage).reduce(
            (acc, [key, value]) => ({ ...acc, [key]: value.toJson() }),
            {} as InferCrdtStorageJson<TStorage>,
        );
    }

    public undo(): this {
        this._undoManager?.undo();

        return this;
    }
}
