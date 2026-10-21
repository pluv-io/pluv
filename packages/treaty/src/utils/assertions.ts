import type { TreatyProcedureLike } from "@pluv/types";
import type { JsonSchemaProducer } from "../types";
import { getJsonSchemaProducer } from "./getJsonSchemaProducer";
import { JsonSchemaError } from "./JsonSchemaError";

export const assertResolvedProcedure = (
    name: string,
    kind: "presence" | "storage",
    procedure: TreatyProcedureLike,
): void => {
    if (typeof procedure.apply !== "function" || !procedure.config.resolve) {
        throw new Error(`Treaty ${kind} procedure "${name}" is missing resolve`);
    }
};

export const assertSerializingSchema = (schema: unknown): JsonSchemaProducer => {
    const producer = getJsonSchemaProducer(schema);

    if (!producer) throw new JsonSchemaError();

    return producer;
};

export const assertOutputJsonSchema = (schema: unknown): JsonSchemaProducer => {
    const producer = assertSerializingSchema(schema);

    if (typeof producer.output !== "function") throw new JsonSchemaError();

    return producer;
};
