import type { YjsDoc } from "@pluv/crdt-yjs";
import { doc } from "@pluv/crdt-yjs";
import type { AbstractType } from "yjs";

export interface CrdtManagerOptions<
    TStorage extends Record<string, AbstractType<any>> = {}
> {
    encodedState?: string | Uint8Array | null;
    initialStorage?: () => TStorage;
}

export class CrdtManager<TStorage extends Record<string, AbstractType<any>>> {
    public doc: YjsDoc<TStorage>;

    constructor(options: CrdtManagerOptions<TStorage> = {}) {
        const { encodedState, initialStorage } = options;

        const doc1 = encodedState
            ? doc<TStorage>().applyUpdate(encodedState)
            : null;

        if (doc1 && !!Object.keys(doc1.toJSON()).length) {
            this.doc = doc1;

            return;
        }

        doc1?.destroy();

        this.doc = doc<TStorage>(initialStorage?.());
    }

    public destroy(): void {
        this.doc.destroy();
    }

    public get<TKey extends keyof TStorage>(key: TKey): TStorage[TKey] {
        return this.doc.get(key);
    }
}
