export const oneLine = (strings: TemplateStringsArray, ...values: unknown[]): string => {
    return strings
        .map((str) => str.replace(/\s+/g, " "))
        .reduce((acc, str, i) => acc + str + (i < values.length ? values[i] : ""), "")
        .replace(/\s+/g, " ")
        .trim();
};
