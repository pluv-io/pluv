import { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { Doc as YDoc } from "yjs";
import type { InferYjsJson, InferYjsSeed, InferYjsStorage, YjsSchema } from "../schema/schema";
import { CrdtYjsDoc } from "./CrdtYjsDoc";

export class CrdtYjsDocFactory<
    TSchema extends YjsSchema = YjsSchema,
> extends AbstractCrdtDocFactory<
    YDoc,
    InferYjsStorage<TSchema>,
    InferYjsJson<TSchema>,
    InferYjsSeed<TSchema>
> {
    public readonly _schema: TSchema;
    public readonly _seed?: InferYjsSeed<TSchema>;

    constructor(schema: TSchema, seed?: InferYjsSeed<TSchema>) {
        super();

        this._schema = schema;
        this._seed = seed;
    }

    public getEmpty(): CrdtYjsDoc<TSchema> {
        return new CrdtYjsDoc<TSchema>(this._schema);
    }

    public getFactory(seed?: InferYjsSeed<TSchema>): CrdtYjsDocFactory<TSchema> {
        return new CrdtYjsDocFactory<TSchema>(this._schema, seed ?? this._seed);
    }

    public getInitialized(seed?: InferYjsSeed<TSchema>): CrdtYjsDoc<TSchema> {
        return new CrdtYjsDoc<TSchema>(
            this._schema,
            (seed ?? this._seed) as Record<string, unknown> | undefined,
            true,
        );
    }
}
