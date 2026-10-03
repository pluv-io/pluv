import type { OperatorUser } from "@pluv/types";

export const parseOperatorUser = (value: unknown): OperatorUser => {
    if (!value || typeof value !== "object") {
        throw new Error("Invalid operator");
    }

    const record = value as Record<string, unknown>;

    if (typeof record.id !== "string" || !record.id) {
        throw new Error("Invalid operator id");
    }

    if (typeof record.name !== "string") {
        throw new Error("Invalid operator name");
    }

    if (record.imageUrl !== null && typeof record.imageUrl !== "string") {
        throw new Error("Invalid operator imageUrl");
    }

    return {
        id: record.id,
        name: record.name,
        imageUrl: record.imageUrl,
    };
};
