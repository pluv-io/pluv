import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { findConfigFile } from "../../utils/loadConfig";

const ZodJsonObject = z.record(z.string(), z.unknown());

export type ProjectTarget = {
    organization: string;
    project: string;
};

export type WriteProjectTargetResult = {
    wrote: boolean;
};

const MARKER = "export default defineConfig";

const TARGET_KEYS = ["organization", "project"] as const;

type TargetKey = (typeof TARGET_KEYS)[number];

type FieldSpan = {
    end: number;
    start: number;
};

const skipWhitespace = (source: string, index: number): number => {
    let cursor = index;

    while (cursor < source.length && /\s/.test(source[cursor] ?? "")) cursor += 1;

    return cursor;
};

const isIdentifierChar = (char: string): boolean => /[A-Za-z0-9_$]/.test(char);

const readTargetKey = (source: string, index: number): TargetKey | null => {
    const before = index === 0 ? "" : (source[index - 1] ?? "");

    if (isIdentifierChar(before)) return null;

    for (const key of TARGET_KEYS) {
        if (!source.startsWith(key, index)) continue;

        const after = source[index + key.length] ?? "";

        if (isIdentifierChar(after)) continue;

        return key;
    }

    return null;
};

const readQuoted = (source: string, index: number): { end: number } | null => {
    const quote = source[index];

    if (quote !== '"' && quote !== "'") return null;

    let cursor = index + 1;

    while (cursor < source.length) {
        const char = source[cursor];

        if (char === "\\") {
            cursor += 2;
            continue;
        }

        if (char === quote) return { end: cursor + 1 };
        if (char === "\n") return null;

        cursor += 1;
    }

    return null;
};

const scanDefineConfigObject = (
    source: string,
    open: number,
): { close: number; fields: Partial<Record<TargetKey, FieldSpan>> } | null => {
    let depth = 0;
    let escaped = false;
    let quote: '"' | "'" | null = null;
    const fields: Partial<Record<TargetKey, FieldSpan>> = {};
    let cursor = open;

    while (cursor < source.length) {
        const char = source[cursor] ?? "";

        if (quote) {
            if (escaped) {
                escaped = false;
                cursor += 1;
                continue;
            }

            if (char === "\\") {
                escaped = true;
                cursor += 1;
                continue;
            }

            if (char === quote) quote = null;

            cursor += 1;
            continue;
        }

        if (char === '"' || char === "'") {
            quote = char;
            cursor += 1;
            continue;
        }

        if (char === "`") return null;

        if (char === "/" && source[cursor + 1] === "/") {
            while (cursor < source.length && source[cursor] !== "\n") cursor += 1;
            continue;
        }

        if (char === "/" && source[cursor + 1] === "*") {
            cursor += 2;

            while (
                cursor < source.length &&
                !(source[cursor] === "*" && source[cursor + 1] === "/")
            ) {
                cursor += 1;
            }

            cursor += 2;
            continue;
        }

        if (char === "{") {
            depth += 1;
            cursor += 1;
            continue;
        }

        if (char === "}") {
            depth -= 1;

            if (depth === 0) return { close: cursor, fields };

            cursor += 1;
            continue;
        }

        if (depth === 1 && source.startsWith("...", cursor)) return null;

        if (depth === 1) {
            const key = readTargetKey(source, cursor);

            if (key) {
                if (fields[key]) return null;

                const afterKey = skipWhitespace(source, cursor + key.length);

                if (source[afterKey] !== ":") return null;

                const valueAt = skipWhitespace(source, afterKey + 1);
                const quoted = readQuoted(source, valueAt);

                if (!quoted) return null;

                fields[key] = { start: valueAt, end: quoted.end };
                cursor = quoted.end;
                continue;
            }
        }

        cursor += 1;
    }

    return null;
};

/** Update organization and project inside `export default defineConfig({ ... })`. */
export const updateDefineConfigSource = (source: string, target: ProjectTarget): string | null => {
    const at = source.indexOf(MARKER);

    if (at < 0) return null;
    if (source.indexOf(MARKER, at + MARKER.length) >= 0) return null;

    let cursor = skipWhitespace(source, at + MARKER.length);

    if (source[cursor] !== "(") return null;

    cursor = skipWhitespace(source, cursor + 1);

    if (source[cursor] !== "{") return null;

    const scanned = scanDefineConfigObject(source, cursor);

    if (!scanned) return null;

    let next = source;
    let close = scanned.close;
    const replacements = TARGET_KEYS.flatMap((key) => {
        const span = scanned.fields[key];

        return span ? [{ key, ...span }] : [];
    }).toSorted((left, right) => right.start - left.start);

    for (const replacement of replacements) {
        const quoted = JSON.stringify(target[replacement.key]);

        next = next.slice(0, replacement.start) + quoted + next.slice(replacement.end);

        if (replacement.start < close) {
            close += quoted.length - (replacement.end - replacement.start);
        }
    }

    const missing = TARGET_KEYS.filter((key) => !scanned.fields[key]);

    if (missing.length === 0) return next;

    const lines = missing.map((key) => `    ${key}: ${JSON.stringify(target[key])},`).join("\n");
    let before = close - 1;

    while (before >= 0 && /\s/.test(next[before] ?? "")) before -= 1;

    const previous = next[before];

    if (previous !== "{" && previous !== ",") {
        next = `${next.slice(0, before + 1)},${next.slice(before + 1)}`;
        close += 1;
    }

    return `${next.slice(0, close)}\n${lines}\n${next.slice(close)}`;
};

const newConfig = (target: ProjectTarget): string => {
    return `import { defineConfig } from "pluv";

export default defineConfig({
    entry: "./pluv.ts",
    organization: ${JSON.stringify(target.organization)},
    project: ${JSON.stringify(target.project)},
});
`;
};

/** Write both slugs into the pluv config. Returns wrote: false when the file cannot be edited safely. */
export const writeProjectTarget = async (
    cwd: string,
    target: ProjectTarget,
): Promise<WriteProjectTargetResult> => {
    const filePath = findConfigFile(cwd);

    if (!filePath) {
        await writeFile(resolve(cwd, "pluv.config.ts"), newConfig(target));

        return { wrote: true };
    }

    if (filePath.endsWith(".json")) {
        let json: unknown;

        try {
            json = JSON.parse(await readFile(filePath, "utf8"));
        } catch {
            return { wrote: false };
        }

        const parsed = ZodJsonObject.safeParse(json);

        if (!parsed.success) return { wrote: false };

        const next = {
            ...parsed.data,
            organization: target.organization,
            project: target.project,
        };

        await writeFile(filePath, `${JSON.stringify(next, null, 4)}\n`);

        return { wrote: true };
    }

    const next = updateDefineConfigSource(await readFile(filePath, "utf8"), target);

    if (!next) return { wrote: false };

    await writeFile(filePath, next);

    return { wrote: true };
};
