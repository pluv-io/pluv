export const sql = (strings: TemplateStringsArray, ...values: any[]): string => {
    return strings
        .reduce((result, str, i) => {
            // Compresses the string to a single line (not including the interpolated values)
            const cleaned = str.replace(/(\n[ \t]*)+/g, " ");

            return result + cleaned + (i < values.length ? values[i] : "");
        }, "")
        .trim();
};
