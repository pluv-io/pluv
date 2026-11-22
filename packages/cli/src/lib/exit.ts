const writeLine = (stream: NodeJS.WriteStream, text: string): void => {
    stream.write(text.endsWith("\n") ? text : `${text}\n`);
};

export type ExitOutput = {
    code: number;
    stderr?: string;
    stdout?: string;
};

/** Write optional streams and stop the process. */
export const exit = (output: ExitOutput): never => {
    if (output.stderr) writeLine(process.stderr, output.stderr);
    if (output.stdout) writeLine(process.stdout, output.stdout);

    return process.exit(output.code);
};
