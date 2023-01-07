import type { JsonObject } from "@pluv/types";
import { fromUint8Array, toUint8Array } from "js-base64";
import type { AbstractType, Map as YMap, Transaction } from "yjs";
import { applyUpdate, Doc as YDoc, encodeStateAsUpdate } from "yjs";

export class YjsDoc<T extends Record<string, AbstractType<any>> = {}> {
    public value: YDoc = new YDoc();

    private get _storage(): YMap<any> {
        return this.value.getMap("storage");
    }

    constructor(value?: T) {
        if (!value) return;

        const storage = this.value.getMap("storage");

        Object.entries(value).forEach(([key, node]) => {
            storage.set(key, node);
        });
    }

    public applyUpdate(update: string | Uint8Array, origin?: string): this {
        const uint8Update =
            typeof update === "string" ? toUint8Array(update) : update;

        applyUpdate(this.value, uint8Update, origin);

        return this;
    }

    public destroy(): void {
        this.value.destroy();
    }

    public encodeStateAsUpdate(): string {
        return fromUint8Array(encodeStateAsUpdate(this.value));
    }

    public get<TKey extends keyof T>(key: TKey): T[TKey] {
        return this._storage.get(key.toString());
    }

    public getSharedTypes(): T {
        return Array.from(this._storage.keys()).reduce(
            (acc, key) => ({ ...acc, [key]: this._storage.get(key) }),
            {} as T
        );
    }

    public subscribe(
        fn: (
            update: string,
            origin: string,
            doc: YDoc,
            transaction: Transaction
        ) => void
    ): () => void {
        const _fn = (
            update: Uint8Array,
            origin: string,
            doc: YDoc,
            transaction: Transaction
        ) => fn(YjsDoc.fromUint8Array(update), origin, doc, transaction);

        this.value.on("update", _fn);

        return () => {
            this.value.off("update", _fn);
        };
    }

    public toJSON(): JsonObject {
        return this._storage.toJSON();
    }

    public static fromUint8Array(u8a: Uint8Array): string {
        return fromUint8Array(u8a);
    }

    public static toUint8Array(str: string): Uint8Array {
        return toUint8Array(str);
    }
}

export const doc = <T extends Record<string, AbstractType<any>> = {}>(
    value?: T
): YjsDoc<T> => {
    return new YjsDoc(value);
};
