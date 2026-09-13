import type { StandardSchemaV1 } from "@pluv/types";

export function parsePluvSchema<TData>(schema: StandardSchemaV1<any, TData>, data: unknown): TData {
    const result = schema["~standard"].validate(data);

    if (result instanceof Promise) {
        throw new Error("Async schemas are not supported. Schema validate() must be synchronous.");
    }

    if (result.issues) {
        const message = result.issues[0]?.message ?? "Invalid input";

        throw new Error(message);
    }

    return result.value as TData;
}
