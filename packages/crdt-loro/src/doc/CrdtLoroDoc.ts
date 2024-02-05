import type {
    AbstractCrdtType,
    DocApplyEncodedStateParams,
    DocSubscribeCallbackParams,
    InferCrdtStorageJson,
} from "@pluv/crdt";
import { AbstractCrdtDoc } from "@pluv/crdt";
import { fromUint8Array, toUint8Array } from "js-base64";
import { Loro, LoroEvent } from "loro-crdt";
import { CrdtLoroArray } from "../array/CrdtLoroArray";
import { CrdtLoroMap } from "../map/CrdtLoroMap";
import { CrdtLoroObject } from "../object/CrdtLoroObject";
import { cloneType } from "../shared";
import { CrdtLoroText } from "../text/CrdtLoroText";

export class CrdtLoroDoc<
    TStorage extends Record<string, AbstractCrdtType<any>>,
> extends AbstractCrdtDoc<TStorage> {
    public value: Loro = new Loro();

    private _storage: TStorage;

    constructor(value: TStorage = {} as TStorage) {
        super();

        this._storage = Object.entries(value).reduce((acc, [key, node]) => {
            if (node instanceof CrdtLoroArray) {
                const loroList = this.value.getList(key);
                cloneType({ source: node.value, target: loroList });

                node.value = loroList;

                return { ...acc, [key]: node };
            }

            if (node instanceof CrdtLoroMap || node instanceof CrdtLoroObject) {
                const loroMap = this.value.getMap(key);
                cloneType({ source: node.value, target: loroMap });

                node.value = loroMap;

                return { ...acc, [key]: node };
            }

            if (node instanceof CrdtLoroText) {
                const loroText = this.value.getText(key);
                cloneType({ source: node.value, target: loroText });

                node.value = loroText;

                return { ...acc, [key]: loroText };
            }

            return acc;
        }, {} as TStorage);
    }

    public applyEncodedState(params: DocApplyEncodedStateParams): this {
        const update =
            typeof params.update === "string"
                ? toUint8Array(params.update)
                : params.update;

        if (!update) return this;

        this.value.import(update);

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
        const _updates = updates.reduce<Uint8Array[]>((acc, item) => {
            if (!item) return acc;

            if (typeof item === "string") {
                acc.push(toUint8Array(item));

                return acc;
            }

            if (typeof item === "object") {
                const update =
                    typeof item.update === "string"
                        ? toUint8Array(item.update)
                        : item.update;

                if (!update) return acc;

                acc.push(update);

                return acc;
            }

            return acc;
        }, []);

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

    public fresh(): CrdtLoroDoc<TStorage> {
        return new CrdtLoroDoc<TStorage>();
    }

    public get(key?: undefined): TStorage;
    public get<TKey extends keyof TStorage>(key: TKey): TStorage[TKey];
    public get<TKey extends keyof TStorage>(
        key?: TKey,
    ): TStorage | TStorage[TKey] {
        if (typeof key === "undefined") return this._storage;

        return this._storage[key as TKey];
    }

    public toJson(): InferCrdtStorageJson<TStorage> {
        return Object.entries(this._storage).reduce(
            (acc, [key, value]) => ({ ...acc, [key]: value.toJson() }),
            {} as InferCrdtStorageJson<TStorage>,
        );
    }

    public getEncodedState(): string {
        return fromUint8Array(this.value.exportSnapshot());
    }

    /**
     * TODO
     * @description This method is not yet supported for loro
     */
    public redo(): this {
        throw new Error("This is not yet supported");
    }

    public subscribe(
        listener: (params: DocSubscribeCallbackParams<TStorage>) => void,
    ): () => void {
        const fn = (event: LoroEvent) => {
            const update = fromUint8Array(this.value.exportFrom());

            listener({
                doc: this,
                local: event.local,
                origin: event.origin,
                update,
            });
        };

        const subscriptionId = this.value.subscribe(fn);

        return () => {
            this.value.unsubscribe(subscriptionId);
        };
    }

    /**
     * TODO
     * @description This method is not yet supported for loro
     */
    public track(): this {
        throw new Error("This is not yet supported");
    }

    /**
     * TODO
     * @description This method is not yet supported for loro
     */
    public transact(fn: () => void): this {
        throw new Error("This is not yet supported");
    }

    /**
     * TODO
     * @description This method is not yet supported for loro
     */
    public undo(): this {
        throw new Error("This is not yet supported");
    }
}
