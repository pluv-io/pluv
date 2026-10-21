import type { JsonSchemaMethod, JsonSchemaProducer } from "../types";
import { JsonSchemaError } from "./JsonSchemaError";

const JSON_SCHEMA_TARGET = "draft-2020-12";

const emitJsonSchema = (produce: JsonSchemaMethod | undefined): unknown => {
    if (typeof produce !== "function") throw new JsonSchemaError();

    return produce({ target: JSON_SCHEMA_TARGET });
};

export const toInputJsonSchema = (schema: JsonSchemaProducer): unknown => {
    return emitJsonSchema(schema.input);
};

export const toOutputJsonSchema = (schema: JsonSchemaProducer): unknown => {
    return emitJsonSchema(schema.output);
};
