import type { JsonSchemaProducer } from "../types";
import { getJsonSchemaProducer } from "./getJsonSchemaProducer";
import { JsonSchemaError } from "./JsonSchemaError";

export const assertSerializingSchema = (schema: unknown): JsonSchemaProducer => {
    const producer = getJsonSchemaProducer(schema);

    if (!producer) throw new JsonSchemaError();

    return producer;
};
