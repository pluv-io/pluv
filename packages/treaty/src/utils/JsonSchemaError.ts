export class JsonSchemaError extends Error {
    constructor() {
        super(
            "Schema must implement Standard Schema and Standard JSON Schema on the same object (e.g. Zod 4.2+ or ArkType).",
        );
        this.name = "JsonSchemaError";
    }
}
