import { CrdtSchemaError } from "@pluv/crdt";
import type { InferYjsSeed, YjsSchema } from "./schema";
import { isYjsSchema } from "./schema";
import { CrdtYjsDocFactory } from "../doc/CrdtYjsDocFactory";

export type YjsStorageOptions<TSchema extends YjsSchema> = {
    schema: TSchema;
};

export const storage = <TSchema extends YjsSchema>(
    options: YjsStorageOptions<TSchema>,
): CrdtYjsDocFactory<TSchema> => {
    if (!isYjsSchema(options.schema)) {
        throw new CrdtSchemaError("yjs.storage requires yjs.schema(...)");
    }

    return new CrdtYjsDocFactory(options.schema);
};

export type YjsStorage<TSchema extends YjsSchema> = CrdtYjsDocFactory<TSchema>;

export type YjsStorageSeed<TSchema extends YjsSchema> = InferYjsSeed<TSchema>;
