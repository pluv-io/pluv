import {
    AbstractCrdtDocFactory,
    createSchemaNode,
    type AnySchemaNode,
    type InferShapeJson,
    type InferShapeSeed,
    type InferShapeStorage,
} from "@pluv/crdt";
import type { Doc as YDoc } from "yjs";
import { CrdtYjsDoc } from "./CrdtYjsDoc";

export class YjsSchema<
    TShape extends Record<string, AnySchemaNode> = Record<string, AnySchemaNode>,
> extends AbstractCrdtDocFactory<
    YDoc,
    InferShapeStorage<TShape>,
    InferShapeJson<TShape>,
    InferShapeSeed<TShape>
> {
    public readonly kind = "y.doc" as const;
    public readonly shape: TShape;
    public readonly _seed?: InferShapeSeed<TShape>;

    constructor(shape: TShape, seed?: InferShapeSeed<TShape>) {
        super();

        this.shape = shape;
        this._seed = seed;
    }

    public toJSON(): { kind: "y.doc"; shape: Record<string, unknown> } {
        return createSchemaNode("y.doc", { shape: this.shape }).toJSON() as {
            kind: "y.doc";
            shape: Record<string, unknown>;
        };
    }

    public getEmpty(): CrdtYjsDoc<YjsSchema<TShape>> {
        return new CrdtYjsDoc<YjsSchema<TShape>>(this);
    }

    public getFactory(seed?: InferShapeSeed<TShape>): YjsSchema<TShape> {
        return new YjsSchema<TShape>(this.shape, seed ?? this._seed);
    }

    public getInitialized(seed?: InferShapeSeed<TShape>): CrdtYjsDoc<YjsSchema<TShape>> {
        return new CrdtYjsDoc<YjsSchema<TShape>>(
            this,
            (seed ?? this._seed) as Record<string, unknown> | undefined,
            true,
        );
    }
}
