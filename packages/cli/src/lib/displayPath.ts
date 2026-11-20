import { isAbsolute, relative } from "node:path";

/** A path shown from the project directory. `dotted` keeps a `./` prefix for files inside it. */
export const displayPath = (cwd: string, target: string, dotted = false): string => {
    const fromCwd = relative(cwd, target);

    if (!fromCwd || fromCwd.startsWith("..") || isAbsolute(fromCwd)) return target;

    return dotted ? `./${fromCwd}` : fromCwd;
};
