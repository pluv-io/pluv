import {
    AbstractCrdtDocFactory,
    createSchemaNode,
    type AnySchemaNode,
    type InferShapeJson,
    type InferShapeSeed,
    type InferShapeStorage,
} from "@pluv/crdt";
import type { LoroDoc } from "loro-crdt";
import { CrdtLoroDoc } from "./CrdtLoroDoc";

export class LoroSchema<
    TShape extends Record<string, AnySchemaNode> = Record<string, AnySchemaNode>,
> extends AbstractCrdtDocFactory<
    LoroDoc,
    InferShapeStorage<TShape>,
    InferShapeJson<TShape>,
    InferShapeSeed<TShape>
> {
    public readonly kind = "loro.doc" as const;
    public readonly shape: TShape;
    public readonly _seed?: InferShapeSeed<TShape>;

    constructor(shape: TShape, seed?: InferShapeSeed<TShape>) {
        super();

        this.shape = shape;
        this._seed = seed;
    }

    public toJSON(): { kind: "loro.doc"; shape: Record<string, unknown> } {
        return createSchemaNode("loro.doc", { shape: this.shape }).toJSON() as {
            kind: "loro.doc";
            shape: Record<string, unknown>;
        };
    }

    public getEmpty(): CrdtLoroDoc<LoroSchema<TShape>> {
        return new CrdtLoroDoc<LoroSchema<TShape>>(this);
    }

    public getFactory(seed?: InferShapeSeed<TShape>): LoroSchema<TShape> {
        return new LoroSchema<TShape>(this.shape, seed ?? this._seed);
    }

    public getInitialized(seed?: InferShapeSeed<TShape>): CrdtLoroDoc<LoroSchema<TShape>> {
        return new CrdtLoroDoc<LoroSchema<TShape>>(
            this,
            (seed ?? this._seed) as Record<string, unknown> | undefined,
            true,
        );
    }
}
