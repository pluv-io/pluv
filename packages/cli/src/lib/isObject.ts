export const isObject = (value: unknown): value is object =>
    typeof value === "object" && value !== null;
