import { Box, Text } from "ink";

const padding = 1;

const widthsFor = (columns: string[], data: Record<string, string>[]): number[] => {
    return columns.map((column) => {
        const longest = Math.max(column.length, ...data.map((row) => (row[column] ?? "").length));

        return longest + padding * 2;
    });
};

const rule = (widths: number[], left: string, cross: string, right: string): string => {
    return left + widths.map((width) => "─".repeat(width)).join(cross) + right;
};

const padded = (value: string, width: number): string => {
    const spaces = width - value.length - padding;

    return `${" ".repeat(padding)}${value}${" ".repeat(spaces)}`;
};

/** A one-line box table. Column names are the keys of each row. */
export const Table = ({ data }: { data: Record<string, string>[] }) => {
    const columns = Object.keys(data[0] ?? {});

    if (columns.length === 0) return null;

    const widths = widthsFor(columns, data);

    return (
        <Box flexDirection="column">
            <Text bold>{rule(widths, "┌", "┬", "┐")}</Text>
            <Box>
                <Text bold>│</Text>
                {columns.map((column, index) => (
                    <Box key={column}>
                        <Text bold color="blue">
                            {padded(column, widths[index] ?? 0)}
                        </Text>
                        <Text bold>│</Text>
                    </Box>
                ))}
            </Box>
            {data.map((row, rowIndex) => (
                <Box key={rowIndex} flexDirection="column">
                    <Text bold>{rule(widths, "├", "┼", "┤")}</Text>
                    <Box>
                        <Text bold>│</Text>
                        {columns.map((column, index) => (
                            <Box key={column}>
                                <Text>{padded(row[column] ?? "", widths[index] ?? 0)}</Text>
                                <Text bold>│</Text>
                            </Box>
                        ))}
                    </Box>
                </Box>
            ))}
            <Text bold>{rule(widths, "└", "┴", "┘")}</Text>
        </Box>
    );
};
