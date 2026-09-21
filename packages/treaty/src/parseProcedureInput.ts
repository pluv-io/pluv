import type { StandardSchemaV1 } from "@pluv/types";

export const parseProcedureInput = <TData>(
    schema: StandardSchemaV1<unknown, TData> | null,
    data: unknown,
): TData => {
    if (!schema) return data as TData;

    const result = schema["~standard"].validate(data);

    if (result instanceof Promise) {
        throw new Error("Async schemas are not supported. Schema validate() must be synchronous.");
    }

    if (result.issues) {
        throw new Error(result.issues[0]?.message ?? "Invalid input");
    }

    return result.value as TData;
};
