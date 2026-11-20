/** Text from a thrown value. */
export const errorText = (error: unknown, fallback: string): string => {
    return error instanceof Error ? error.message : fallback;
};

/** Write a message and stop the process. */
export const exitWith = (text: string, code: number): never => {
    process.stderr.write(`${text}\n`);
    process.exit(code);
    throw new Error(text);
};
