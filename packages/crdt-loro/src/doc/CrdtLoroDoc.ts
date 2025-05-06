import type {
    DocApplyEncodedStateParams,
    DocBatchApplyEncodedStateParams,
    DocSubscribeCallbackParams,
    InferCrdtJson,
} from "@pluv/crdt";
import { AbstractCrdtDoc } from "@pluv/crdt";
import { fromUint8Array, toUint8Array } from "js-base64";
import type { Container } from "loro-crdt";
import {
    LoroCounter,
    LoroDoc,
    LoroEventBatch,
    LoroList,
    LoroMap,
    LoroText,
    UndoManager,
    isContainer,
} from "loro-crdt";
import type { LoroType } from "../types";

const MAX_UNDO_STEPS = 100;
const MERGE_INTERVAL_MS = 1_000;

export class CrdtLoroDoc<
    TStorage extends Record<string, LoroType<any, any>>,
> extends AbstractCrdtDoc<TStorage> {
    public value: LoroDoc = new LoroDoc();

    private _storage: TStorage;
    private _undoManager: UndoManager | null = null;

    constructor(value: TStorage = {} as TStorage) {
        super();

        this._storage = Object.entries(value).reduce((acc, [key, node]) => {
            if (node instanceof LoroList) {
                const container = this.value.getList(key);

                node.toArray().forEach((item, i) => {
                    if (isContainer(item)) container.insertContainer(i, item);
                    else container.insert(i, item);
                });

                return { ...acc, [key]: container };
            }

            if (node instanceof LoroMap) {
                const container = this.value.getMap(key);

                container.entries().forEach(([key, item]) => {
                    if (isContainer(item)) container.setContainer(key, item);
                    else container.set(key, item);
                });

                return { ...acc, [key]: container };
            }

            if (node instanceof LoroText) {
                const container = this.value.getText(key);

                container.insert(0, node.toString());

                return { ...acc, [key]: container };
            }

            return acc;
        }, {} as TStorage);
    }

    public applyEncodedState(params: DocApplyEncodedStateParams): this {
        const update =
            typeof params.update === "string" ? toUint8Array(params.update) : params.update;

        if (!update) return this;

        this.value.import(update);

        return this;
    }

    public batchApplyEncodedState(params: DocBatchApplyEncodedStateParams): this {
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

        if (filtered.length === 1) {
            const update = filtered[0] ?? null;

            if (!!update) this.value.import(update);

            return this;
        }

        this.value.importBatch(filtered);

        return this;
    }

    public canRedo(): boolean {
        if (!this._undoManager) return false;

        return this._undoManager.canRedo();
    }

    public canUndo(): boolean {
        if (!this._undoManager) return false;

        return this._undoManager.canUndo();
    }

    public destroy(): void {
        return;
    }

    public get(key?: undefined): TStorage;
    public get<TKey extends keyof TStorage>(key: TKey): TStorage[TKey];
    public get<TKey extends keyof TStorage>(key?: TKey): TStorage | TStorage[TKey] {
        if (typeof key === "undefined") return this._storage;

        return this._storage[key as TKey];
    }

    public getEncodedState(): string {
        return fromUint8Array(this.value.export({ mode: "snapshot" }));
    }

    public toJson(): InferCrdtJson<TStorage>;
    public toJson<TKey extends keyof TStorage>(type: TKey): InferCrdtJson<TStorage[TKey]>;
    public toJson<TKey extends keyof TStorage>(type?: TKey) {
        if (typeof type === "string") {
            const container = this._storage[type] as unknown as Container;

            return container instanceof LoroText
                ? container.toString()
                : container instanceof LoroCounter
                  ? container.value
                  : container.toJSON!();
        }

        return Object.entries(this._storage).reduce(
            (acc, [key, value]) => ({
                ...(acc as any),
                [key]: value instanceof LoroText ? value.toString() : value.toJSON!(),
            }),
            {} as InferCrdtJson<TStorage>,
        );
    }

    public isEmpty(): boolean {
        const serialized = this.value.toJSON();

        return !serialized || !Object.keys(serialized).length;
    }

    public redo(): this {
        this._undoManager?.redo();

        return this;
    }

    public subscribe(listener: (params: DocSubscribeCallbackParams<TStorage>) => void): () => void {
        const fn = (event: LoroEventBatch) => {
            const update = fromUint8Array(this.value.export({ mode: "update" }));

            listener({
                doc: this,
                local: event.by === "local",
                origin: event.origin ? String(event.origin) : null,
                update,
            });
        };

        const unsubcribeAll = Object.values(this._storage).reduce<() => void>(
            (acc, crdtType) => {
                const container = crdtType as unknown as Container;
                const unsubscribe = container.subscribe(fn);

                return () => {
                    acc();
                    unsubscribe();
                };
            },
            () => undefined,
        );

        return unsubcribeAll;
    }

    public track(): this {
        if (this._undoManager) {
            this._undoManager.clear();
            this._undoManager.free();

            this._undoManager = null;
        }

        this._undoManager = new UndoManager(this.value, {
            maxUndoSteps: MAX_UNDO_STEPS,
            mergeInterval: MERGE_INTERVAL_MS,
        });

        return this;
    }

    /**
     * @description Unlike Yjs, this method is required to be called after each loro operation.
     * @date January 12, 2025
     */
    public transact(fn: () => void): this {
        fn();

        this.value.commit();

        return this;
    }

    public undo(): this {
        this._undoManager?.undo();

        return this;
    }
}
