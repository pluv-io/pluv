export class CrdtSchemaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CrdtSchemaError";
    }
}
