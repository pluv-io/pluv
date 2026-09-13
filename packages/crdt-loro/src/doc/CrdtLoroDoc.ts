import type {
    DocApplyEncodedStateParams,
    DocBatchApplyEncodedStateParams,
    DocSubscribeCallbackParams,
} from "@pluv/crdt";
import type { CrdtDocLike } from "@pluv/types";
import { fromUint8Array, toUint8Array } from "js-base64";
import type { Container } from "loro-crdt";
import {
    LoroCounter,
    LoroDoc,
    LoroEventBatch,
    LoroList,
    LoroMap,
    LoroMovableList,
    LoroText,
    LoroTree,
    UndoManager,
} from "loro-crdt";
import { getLoroShare, hydrateTopLevel } from "../schema/hydrate";
import type { InferLoroJson, InferLoroStorage, LoroSchema } from "../schema/schema";

const MAX_UNDO_STEPS = 100;
const MERGE_INTERVAL_MS = 1_000;
const PLUV_ID_FIELD = "__$pluv";

export class CrdtLoroDoc<TSchema extends LoroSchema = LoroSchema> implements CrdtDocLike<
    LoroDoc,
    InferLoroStorage<TSchema>,
    InferLoroJson<TSchema>
> {
    public value: LoroDoc = new LoroDoc();

    #_schema: TSchema;
    #_storage: InferLoroStorage<TSchema>;
    #_undoManager: UndoManager | null = null;

    constructor(schema: TSchema, seed?: Record<string, unknown>, hydrate: boolean = false) {
        this.#_schema = schema;

        if (hydrate) {
            this.#_storage = hydrateTopLevel(this.value, schema, seed) as InferLoroStorage<TSchema>;
            if (Object.keys(schema.shape).length) this.#_setPluvId();
        } else {
            this.#_storage = {} as InferLoroStorage<TSchema>;
        }

        this.value.commit();
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
        if (!this.#_undoManager) return false;

        return this.#_undoManager.canRedo();
    }

    public canUndo(): boolean {
        if (!this.#_undoManager) return false;

        return this.#_undoManager.canUndo();
    }

    public destroy(): void {
        return;
    }

    public get(key?: undefined): InferLoroStorage<TSchema>;
    public get<TKey extends keyof InferLoroStorage<TSchema>>(
        key: TKey,
    ): InferLoroStorage<TSchema>[TKey];
    public get<TKey extends keyof InferLoroStorage<TSchema>>(
        key?: TKey,
    ): InferLoroStorage<TSchema> | InferLoroStorage<TSchema>[TKey] {
        if (typeof key === "undefined") return this.#_storage;

        return this.#_storage[key as TKey];
    }

    public getEncodedState(): string {
        return fromUint8Array(this.value.export({ mode: "snapshot" }));
    }

    public toJson(): InferLoroJson<TSchema>;
    public toJson<TKey extends keyof InferLoroJson<TSchema>>(
        type: TKey,
    ): InferLoroJson<TSchema>[TKey];
    public toJson<TKey extends keyof InferLoroJson<TSchema>>(type?: TKey) {
        const serialized = this.value.toJSON() as Record<string, unknown>;

        if (typeof type === "string") {
            const container = this.#_storage[type] as unknown as Container | undefined;

            if (container) {
                return container instanceof LoroText
                    ? container.toString()
                    : container instanceof LoroCounter
                      ? container.value
                      : container.toJSON!();
            }

            return (serialized[type] ?? null) as InferLoroJson<TSchema>[TKey];
        }

        const { [PLUV_ID_FIELD]: _pluvId, ...json } = serialized;

        return json as InferLoroJson<TSchema>;
    }

    public isDirty(): boolean {
        return !!this.value.oplogFrontiers().length;
    }

    public isEmpty(): boolean {
        const serialized = this.value.toJSON();

        return !serialized || !Object.keys(serialized).length;
    }

    public rebuildStorage(): this {
        const isBuilt = !!Object.keys(this.#_storage).length;

        if (isBuilt) {
            console.warn("Attempted to rebuild storage multiple times");
            return this;
        }

        this.#_storage = Object.entries(this.#_schema.shape).reduce((acc, [key, node]) => {
            Object.assign(acc, { [key]: getLoroShare(this.value, key, node.kind) });
            return acc;
        }, {} as InferLoroStorage<TSchema>);

        return this.track();
    }

    public redo(): this {
        this.#_undoManager?.redo();

        return this;
    }

    public subscribe(
        listener: (
            params: DocSubscribeCallbackParams<
                LoroDoc,
                InferLoroStorage<TSchema>,
                InferLoroJson<TSchema>
            >,
        ) => void,
    ): () => void {
        const fn = (event: LoroEventBatch) => {
            const update = fromUint8Array(this.value.export({ mode: "update" }));

            listener({
                doc: this,
                local: event.by === "local",
                origin: event.origin ? event.origin : null,
                update,
            });
        };

        const unsubcribeAll = Object.values(this.#_storage).reduce<() => void>(
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
        if (this.#_undoManager) {
            this.#_undoManager.clear();
            this.#_undoManager.free();

            this.#_undoManager = null;
        }

        this.#_undoManager = new UndoManager(this.value, {
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
        this.#_undoManager?.undo();

        return this;
    }

    #_setPluvId() {
        const text = this.value.getText(PLUV_ID_FIELD);
        const id = typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString();

        text.insert(0, id);
    }
}
