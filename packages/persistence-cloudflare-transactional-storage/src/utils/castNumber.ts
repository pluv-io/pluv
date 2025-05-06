export const castNumber = (value: any): number => {
    return typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number.parseInt(value, 10)
          : Number(value);
};
