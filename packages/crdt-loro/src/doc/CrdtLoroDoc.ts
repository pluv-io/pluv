import type { DocApplyEncodedStateParams, DocSubscribeCallbackParams, InferCrdtJson } from "@pluv/crdt";
import { AbstractCrdtDoc } from "@pluv/crdt";
import { fromUint8Array, toUint8Array } from "js-base64";
import type { Container, LoroEventBatch } from "loro-crdt";
import { LoroDoc, LoroList, LoroMap, LoroText, isContainer } from "loro-crdt";
import type ZZ{ LoroType } from "../types";

export class CrdtLoroDoc<TStorage extends Record<string, LoroType<any, any>>> extends AbstractCrdtDoc<TStorage> {
    public value: LoroDoc = new LoroDoc();

    private _storage: TStorage;

    constructor(value: TStorage = {} as TStorage) {
        super();

        this._storage = Object.entries(value).reduce((acc, [key, node]) => {
            if (node instanceof LoroList) {
                const container = this.value.getList(key);

                node.toArray().forEach((item, i) => {
                    isContainer(item) ? container.insertContainer(i, item) : container.insert(i, item);
                });

                return { ...acc, [key]: container };
            }

            if (node instanceof LoroMap) {
                const container = this.value.getMap(key);

                container.entries().forEach(([key, item]) => {
                    isContainer(item) ? container.setContainer(key, item) : container.set(key, item);
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
        const update = typeof params.update === "string" ? toUint8Array(params.update) : params.update;

        if (!update) return this;

        this.value.import(update);

        return this;
    }

    public batchApplyEncodedState(updates: readonly (DocApplyEncodedStateParams | string | null | undefined)[]): this {
        const _updates = updates.reduce<Uint8Array[]>((acc, item) => {
            if (!item) return acc;

            if (typeof item === "string") {
                acc.push(toUint8Array(item));

                return acc;
            }

            if (typeof item === "object") {
                const update = typeof item.update === "string" ? toUint8Array(item.update) : item.update;

                if (!update) return acc;

                acc.push(update);

                return acc;
            }

            return acc;
        }, []);

        if (!_updates.length) return this;

        if (_updates.length === 1) {
            const update = _updates[0] ?? null;

            update && this.value.import(update);

            return this;
        }

        this.value.importUpdateBatch(_updates);

        return this;
    }

    /**
     * TODO
     * @description This method is not yet supported for loro
     */
    public canRedo(): boolean {
        return false;
    }

    /**
     * TODO
     * @description This method is not yet supported for loro
     */
    public canUndo(): boolean {
        return false;
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

            return container instanceof LoroText ? container.toString() : container.toJSON!();
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

    /**
     * TODO
     * @description This method is not yet supported for loro
     */
    public redo(): this {
        throw new Error("This is not yet supported");
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

    /**
     * TODO
     * @description This method doesn't do anything yet.
     */
    public track(): this {
        return this;
    }

    /**
     * TODO
     * @description This method doesn't do anything yet. The callback will still be executed.
     */
    public transact(fn: () => void): this {
        fn();

        this.value.commit();

        return this;
    }

    /**
     * TODO
     * @description This method is not yet supported for loro
     */
    public undo(): this {
        throw new Error("This is not yet supported");
    }
}
