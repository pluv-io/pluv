import type { TreatyProcedureLike } from "@pluv/types";

export const assertResolvedProcedure = (
    name: string,
    kind: "presence" | "storage",
    procedure: TreatyProcedureLike,
): void => {
    if (typeof procedure.apply !== "function" || !procedure.config.resolve) {
        throw new Error(`Treaty ${kind} procedure "${name}" is missing resolve`);
    }
};
