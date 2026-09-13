import { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { LoroDoc } from "loro-crdt";
import type { InferLoroJson, InferLoroSeed, InferLoroStorage, LoroSchema } from "../schema/schema";
import { CrdtLoroDoc } from "./CrdtLoroDoc";

export class CrdtLoroDocFactory<
    TSchema extends LoroSchema = LoroSchema,
> extends AbstractCrdtDocFactory<
    LoroDoc,
    InferLoroStorage<TSchema>,
    InferLoroJson<TSchema>,
    InferLoroSeed<TSchema>
> {
    public readonly _schema: TSchema;
    public readonly _seed?: InferLoroSeed<TSchema>;

    constructor(schema: TSchema, seed?: InferLoroSeed<TSchema>) {
        super();

        this._schema = schema;
        this._seed = seed;
    }

    public getEmpty(): CrdtLoroDoc<TSchema> {
        return new CrdtLoroDoc<TSchema>(this._schema);
    }

    public getFactory(seed?: InferLoroSeed<TSchema>): CrdtLoroDocFactory<TSchema> {
        return new CrdtLoroDocFactory<TSchema>(this._schema, seed ?? this._seed);
    }

    public getInitialized(seed?: InferLoroSeed<TSchema>): CrdtLoroDoc<TSchema> {
        return new CrdtLoroDoc<TSchema>(
            this._schema,
            (seed ?? this._seed) as Record<string, unknown> | undefined,
            true,
        );
    }
}
