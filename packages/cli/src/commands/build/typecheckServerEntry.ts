import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, parse, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { displayPath } from "../../lib/displayPath";
import { isObject } from "../../lib/isObject";
import { assertTypeScriptEntry } from "../../lib/typescriptEntry";

const missingTypeScriptMessage = [
    "Could not find typescript in this project.",
    "",
    "Install it as a devDependency, or skip this step with --no-typecheck.",
    "",
    "  npm install --save-dev typescript",
].join("\n");

type DiagnosticLike = {
    category: number;
    code: number;
    fileName?: string;
    pos?: number;
    start?: number;
    file?: { fileName: string };
};

type ClassicTypeScript = {
    DiagnosticCategory: { Error: number };
    readConfigFile: (
        path: string,
        readFile: (path: string) => string | undefined,
    ) => { config?: unknown; error?: DiagnosticLike };
    parseJsonConfigFileContent: (
        json: unknown,
        host: unknown,
        basePath: string,
        existingOptions: unknown,
        configFileName: string,
    ) => { options: Record<string, unknown>; errors: DiagnosticLike[] };
    createProgram: (options: {
        rootNames: string[];
        options: Record<string, unknown>;
        configFileName: string;
    }) => unknown;
    getPreEmitDiagnostics: (program: unknown) => DiagnosticLike[];
    formatDiagnostics: (diagnostics: readonly DiagnosticLike[], host: unknown) => string;
    sys: {
        readFile: (path: string) => string | undefined;
    };
};

type SyncDiagnostic = {
    category: number;
    code: number;
    fileName?: string;
    pos?: number;
};

type SyncProgram = {
    getSyntacticDiagnostics: () => readonly SyncDiagnostic[];
    getBindDiagnostics: () => readonly SyncDiagnostic[];
    getSemanticDiagnostics: () => readonly SyncDiagnostic[];
    getGlobalDiagnostics: () => readonly SyncDiagnostic[];
    getProgramDiagnostics: () => readonly SyncDiagnostic[];
};

type SyncNamespace = {
    API: new (options: { cwd: string }) => SyncHost & {
        parseConfigFile: (file: string) => {
            options: Record<string, unknown>;
            errors: SyncDiagnostic[];
        };
        createProgram: (
            rootFiles: readonly string[],
            options: Record<string, unknown>,
        ) => SyncProgram;
        close: () => void;
    };
    DiagnosticCategory: { Error: number };
    formatDiagnostics: (diagnostics: readonly SyncDiagnostic[], host: SyncHost) => string;
};

type SyncHost = {
    getCurrentDirectory: () => string;
    getCanonicalFileName: (fileName: string) => string;
    getNewLine: () => string;
};

type Compiler = { kind: "classic"; ts: ClassicTypeScript } | { kind: "sync"; ts: SyncNamespace };

const isModuleNotFound = (error: unknown): boolean => {
    return isObject(error) && "code" in error && error.code === "MODULE_NOT_FOUND";
};

const missingTsConfigMessage = (cwd: string, entry: string, sawJsConfig: boolean): string => {
    const lines = [
        `No tsconfig.json was found for ${displayPath(cwd, entry, true)}.`,
        "",
        "Add a tsconfig.json for the server entry.",
    ];

    if (sawJsConfig) lines.push("A jsconfig.json is not used.");

    return lines.join("\n");
};

/** Walk from the entry toward the filesystem root, the same way `tsc` finds `tsconfig.json`. */
export const findTsConfigForEntry = (entry: string, cwd: string): string => {
    let dir = dirname(resolve(entry));
    const { root } = parse(dir);
    let sawJsConfig = false;

    while (true) {
        const tsconfig = join(dir, "tsconfig.json");

        if (existsSync(tsconfig)) return tsconfig;

        if (existsSync(join(dir, "jsconfig.json"))) sawJsConfig = true;

        if (dir === root) break;

        const parent = dirname(dir);

        if (parent === dir) break;

        dir = parent;
    }

    throw new Error(missingTsConfigMessage(cwd, entry, sawJsConfig));
};

const diagnosticKey = (diagnostic: DiagnosticLike | SyncDiagnostic): string => {
    const file =
        diagnostic.fileName ?? ("file" in diagnostic ? diagnostic.file?.fileName : undefined) ?? "";
    const pos = diagnostic.pos ?? ("start" in diagnostic ? diagnostic.start : undefined) ?? 0;

    return `${diagnostic.code}:${file}:${pos}`;
};

const uniqueErrors = <T extends { category: number; code: number }>(
    diagnostics: readonly T[],
    errorCategory: number,
): T[] => {
    const seen = new Set<string>();
    const errors: T[] = [];

    for (const diagnostic of diagnostics) {
        if (diagnostic.category !== errorCategory) continue;

        const key = diagnosticKey(diagnostic);

        if (seen.has(key)) continue;

        seen.add(key);
        errors.push(diagnostic);
    }

    return errors;
};

/** True when `resolved` lives in `node_modules` at `cwd` or a parent directory. */
const isProjectTypeScript = (cwd: string, resolved: string): boolean => {
    const file = resolve(resolved);
    let dir = resolve(cwd);
    const { root } = parse(dir);

    while (true) {
        const modules = join(dir, "node_modules");

        if (file === modules || file.startsWith(`${modules}${sep}`)) return true;

        if (dir === root) return false;

        const parent = dirname(dir);

        if (parent === dir) return false;

        dir = parent;
    }
};

const loadProjectTypeScript = async (cwd: string): Promise<Compiler> => {
    const nodeRequire = createRequire(join(cwd, "package.json"));
    let classicPath: string;

    try {
        classicPath = nodeRequire.resolve("typescript");
    } catch (error) {
        if (isModuleNotFound(error)) {
            throw new Error(missingTypeScriptMessage, { cause: error });
        }

        throw error;
    }

    if (!isProjectTypeScript(cwd, classicPath)) throw new Error(missingTypeScriptMessage);

    const classicModule = (await import(pathToFileURL(classicPath).href)) as {
        createProgram?: unknown;
        default?: { createProgram?: unknown };
    };
    const classic = classicModule.createProgram
        ? classicModule
        : classicModule.default?.createProgram
          ? classicModule.default
          : null;

    if (classic?.createProgram) return { kind: "classic", ts: classic as ClassicTypeScript };

    let syncPath: string;

    try {
        syncPath = nodeRequire.resolve("typescript/sync");
    } catch (error) {
        if (isModuleNotFound(error)) {
            throw new Error(missingTypeScriptMessage, { cause: error });
        }

        throw error;
    }

    const sync = (await import(pathToFileURL(syncPath).href)) as SyncNamespace;

    if (typeof sync.API !== "function") throw new Error(missingTypeScriptMessage);

    return { kind: "sync", ts: sync };
};

const typecheckWithClassic = (ts: ClassicTypeScript, entry: string, configPath: string): void => {
    const read = ts.readConfigFile(configPath, ts.sys.readFile);

    if (read.error) {
        throw new Error(ts.formatDiagnostics([read.error], ts.sys).trim());
    }

    const parsed = ts.parseJsonConfigFileContent(
        read.config,
        ts.sys,
        dirname(configPath),
        undefined,
        configPath,
    );
    const configErrors = uniqueErrors(parsed.errors, ts.DiagnosticCategory.Error);

    if (configErrors.length > 0) {
        throw new Error(ts.formatDiagnostics(configErrors, ts.sys).trim());
    }

    const program = ts.createProgram({
        rootNames: [entry],
        options: parsed.options,
        configFileName: configPath,
    });
    const diagnostics = uniqueErrors(
        ts.getPreEmitDiagnostics(program),
        ts.DiagnosticCategory.Error,
    );

    if (diagnostics.length === 0) return;

    throw new Error(ts.formatDiagnostics(diagnostics, ts.sys).trim());
};

const typecheckWithSync = (
    ts: SyncNamespace,
    cwd: string,
    entry: string,
    configPath: string,
): void => {
    const api = new ts.API({ cwd });

    try {
        const parsed = api.parseConfigFile(configPath);
        const configErrors = uniqueErrors(parsed.errors, ts.DiagnosticCategory.Error);

        if (configErrors.length > 0) {
            throw new Error(ts.formatDiagnostics(configErrors, api).trim());
        }

        const program = api.createProgram([entry], parsed.options);
        const diagnostics = uniqueErrors(
            [
                ...program.getSyntacticDiagnostics(),
                ...program.getBindDiagnostics(),
                ...program.getSemanticDiagnostics(),
                ...program.getGlobalDiagnostics(),
                ...program.getProgramDiagnostics(),
            ],
            ts.DiagnosticCategory.Error,
        );

        if (diagnostics.length === 0) return;

        const text = ts.formatDiagnostics(diagnostics, api).trim();

        throw new Error(text || "TypeScript reported errors in the server entry.");
    } finally {
        api.close();
    }
};

/** Typecheck the server entry with the project's `typescript` and `tsconfig.json`. */
export const typecheckServerEntry = async (options: {
    cwd: string;
    entry: string;
}): Promise<void> => {
    const entry = resolve(options.cwd, options.entry);

    assertTypeScriptEntry(options.cwd, entry);

    const configPath = findTsConfigForEntry(entry, options.cwd);
    const typescript = await loadProjectTypeScript(options.cwd);

    if (typescript.kind === "classic") {
        typecheckWithClassic(typescript.ts, entry, configPath);
        return;
    }

    typecheckWithSync(typescript.ts, options.cwd, entry, configPath);
};
