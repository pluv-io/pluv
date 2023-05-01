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

        const _doc = encodedState
            ? doc<TStorage>().applyUpdate(encodedState)
            : null;

        if (_doc && !!Object.keys(_doc.toJSON()).length) {
            this.doc = _doc;

            return;
        }

        _doc?.destroy();

        this.doc = doc<TStorage>(initialStorage?.());
    }

    public destroy(): void {
        this.doc.destroy();
    }

    public get<TKey extends keyof TStorage>(key: TKey): TStorage[TKey] {
        return this.doc.get(key);
    }
}
