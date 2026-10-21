import type { JsonSchemaProducer } from "../types";

const JSON_SCHEMA_TARGET = "draft-2020-12";

export const toJsonSchema = (schema: JsonSchemaProducer): unknown => {
    return schema.input({ target: JSON_SCHEMA_TARGET });
};
