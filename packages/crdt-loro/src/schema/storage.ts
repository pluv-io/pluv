import { CrdtSchemaError } from "@pluv/crdt";
import { CrdtLoroDocFactory } from "../doc/CrdtLoroDocFactory";
import type { InferLoroSeed, LoroSchema } from "./schema";
import { isLoroSchema } from "./schema";

export type LoroStorageOptions<TSchema extends LoroSchema> = {
    schema: TSchema;
};

export const storage = <TSchema extends LoroSchema>(
    options: LoroStorageOptions<TSchema>,
): CrdtLoroDocFactory<TSchema> => {
    if (!isLoroSchema(options.schema)) {
        throw new CrdtSchemaError("loro.storage requires loro.schema(...)");
    }

    return new CrdtLoroDocFactory(options.schema);
};

export type LoroStorage<TSchema extends LoroSchema> = CrdtLoroDocFactory<TSchema>;
export type LoroStorageSeed<TSchema extends LoroSchema> = InferLoroSeed<TSchema>;
