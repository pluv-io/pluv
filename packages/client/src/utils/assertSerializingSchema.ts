const getJsonSchemaProducer = (
    schema: unknown,
): { input: (options?: { target?: string }) => unknown } | null => {
    const jsonSchema = (schema as { "~standard"?: { jsonSchema?: { input?: unknown } } })?.[
        "~standard"
    ]?.jsonSchema;

    if (!jsonSchema || typeof jsonSchema.input !== "function") return null;

    return jsonSchema as { input: (options?: { target?: string }) => unknown };
};

export const assertSerializingSchema = (schema: unknown, label: string): void => {
    if (!getJsonSchemaProducer(schema)) {
        throw new Error(
            `${label} must implement Standard Schema and Standard JSON Schema on the same object (e.g. Zod 4.2+ or ArkType).`,
        );
    }
};
