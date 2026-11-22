import { basename, extname, resolve } from "node:path";
import { displayPath } from "./displayPath";

const TYPESCRIPT_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);
const RENAME_HINT_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);

/** True when `entry` is a TypeScript module path. */
export const isTypeScriptEntry = (entry: string): boolean => {
    return TYPESCRIPT_EXTENSIONS.has(extname(entry).toLowerCase());
};

/** Terminal text when the io server entry is not TypeScript. */
export const typescriptEntryMessage = (cwd: string, entry: string): string => {
    const extension = extname(entry).toLowerCase();
    const shown = displayPath(cwd, resolve(cwd, entry), true);
    const lines = [
        "pluv requires a TypeScript server entry.",
        "",
        `  entry: ${shown}`,
        "",
        "The server entry must be TypeScript (.ts, .tsx, .mts, or .cts).",
        "JavaScript entrypoints are not supported. You can still import .js modules from a TypeScript entry.",
    ];

    if (RENAME_HINT_EXTENSIONS.has(extension)) {
        const fileName = basename(entry);
        const stem = basename(entry, extname(entry));

        lines.push("", `For example, rename ${fileName} to ${stem}.ts.`);
    }

    return lines.join("\n");
};

/** Throw when a non-empty entry is not a TypeScript module. */
export const assertTypeScriptEntry = (cwd: string, entry: string): void => {
    if (entry.length === 0 || isTypeScriptEntry(entry)) return;

    throw new Error(typescriptEntryMessage(cwd, entry));
};
