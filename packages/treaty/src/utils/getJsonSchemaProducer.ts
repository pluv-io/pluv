import type { JsonSchemaProducer } from "../types";

export const getJsonSchemaProducer = (schema: unknown): JsonSchemaProducer | null => {
    const jsonSchema = (schema as { "~standard"?: { jsonSchema?: JsonSchemaProducer } })?.[
        "~standard"
    ]?.jsonSchema;

    if (!jsonSchema || typeof jsonSchema.input !== "function") return null;

    return jsonSchema;
};
