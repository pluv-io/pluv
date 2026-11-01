import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { prettifyError, type ZodError } from "zod";
import {
    DEFAULT_ENTRY,
    ZodPluvConfigSchema,
    ZodPluvConfigFileSchema,
    type PluvConfig,
    type PluvConfigFile,
} from "../schemas";
import { loadDotenv } from "./loadDotenv";

const CONFIG_NAMES = [
    "pluv.config.ts",
    "pluv.config.mts",
    "pluv.config.js",
    "pluv.config.mjs",
    "pluv.config.json",
] as const;

const schemaError = (error: ZodError, filePath?: string): Error => {
    const text = prettifyError(error).trim();

    return new Error(filePath ? `${filePath}\n${text}` : text);
};

const parseConfigFile = (value: unknown, filePath: string): PluvConfigFile => {
    const parsed = ZodPluvConfigFileSchema.safeParse(value);

    if (!parsed.success) throw schemaError(parsed.error, filePath);

    return parsed.data;
};

const loadConfigFile = async (cwd: string): Promise<PluvConfigFile | null> => {
    const name = CONFIG_NAMES.find((candidate) => existsSync(resolve(cwd, candidate)));

    if (!name) return null;

    const filePath = resolve(cwd, name);
    const loaded: unknown = name.endsWith(".json")
        ? parseJsonConfig(filePath, await readFile(filePath, "utf8"))
        : ((await import(pathToFileURL(filePath).href)) as { default?: unknown }).default;

    return parseConfigFile(loaded, filePath);
};

const parseJsonConfig = (filePath: string, text: string): unknown => {
    try {
        return JSON.parse(text) as unknown;
    } catch {
        throw new Error(`${filePath} is not valid JSON.`);
    }
};

export type DevFlags = {
    entry?: string;
    port?: number;
};

export type ResolvedDevConfig = {
    config: PluvConfig;
    /** Set when no `pluv.config` file exists. */
    warning: string | null;
};

const MISSING_CONFIG_WARNING = "No pluv.config.ts was found. Defaults will be used.";

/** Merge Pastel's parsed flags over `pluv.config.ts`. */
export const resolveDevConfig = async (
    cwd: string,
    flags: DevFlags,
): Promise<ResolvedDevConfig> => {
    loadDotenv(cwd);

    const file = await loadConfigFile(cwd);
    const entry = flags.entry ?? file?.entry ?? (file ? undefined : DEFAULT_ENTRY);
    const parsed = ZodPluvConfigSchema.safeParse({
        entry,
        env: file?.env,
        distDir: file?.distDir,
        port: flags.port ?? file?.port,
    });

    if (!parsed.success) throw schemaError(parsed.error);

    const config = {
        ...parsed.data,
        entry: resolve(cwd, parsed.data.entry),
        distDir: resolve(cwd, parsed.data.distDir),
    };

    return {
        config,
        warning: file ? null : MISSING_CONFIG_WARNING,
    };
};
