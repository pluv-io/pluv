import path from "node:path";
import type { CompilerOptions, Program } from "typescript";
import ts from "typescript";

export interface ResolveDependenciesParams {
    input: string;
}

const crawlDependencies = (program: Program): readonly string[] => {
    const [entryFileName] = program.getRootFileNames();

    if (!entryFileName) return [];

    const dependencies = new Set<string>();
    const visited = new Set<string>();

    const visit = (filePath: string): void => {
        if (visited.has(filePath)) return;

        visited.add(filePath);

        const sourceText = ts.sys.readFile(filePath);

        if (!sourceText) return;

        const sourceFile = ts.createSourceFile(
            filePath,
            sourceText,
            ts.ScriptTarget.ESNext,
            true,
        );

        ts.forEachChild(sourceFile, (node) => {
            if (!ts.isImportDeclaration(node)) return;

            const moduleName = node.moduleSpecifier
                .getText()
                .replace(/(^("|'|`))|(("|'|`)$)/g, "");

            const resolvedModule = ts.resolveModuleName(
                moduleName,
                sourceFile.fileName,
                program.getCompilerOptions(),
                ts.sys,
            );

            const resolvedFile =
                resolvedModule.resolvedModule?.resolvedFileName;

            if (!resolvedFile) return;

            dependencies.add(resolvedFile);

            visit(resolvedFile);
        });
    };

    visit(entryFileName);

    return Array.from(dependencies.values())
        .map((dependency) => {
            const sourceFile = program.getSourceFile(dependency);

            return sourceFile?.fileName;
        })
        .filter((fileName): fileName is string => typeof fileName === "string");
};

const getTsConfigPath = () => {
    const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");

    if (!ts.sys.fileExists(tsConfigPath)) return null;

    return tsConfigPath;
};

export const resolveDependencies = (
    params: ResolveDependenciesParams,
): readonly string[] => {
    const { input } = params;

    const tsConfigPath = getTsConfigPath();
    const basePath = tsConfigPath ? path.dirname(tsConfigPath) : process.cwd();

    const compilerOptions: CompilerOptions = {
        allowJs: true,
        allowSyntheticDefaultImports: true,
        checkJs: false,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        incremental: false,
        inlineSources: false,
        isolatedModules: true,
        jsx: ts.JsxEmit.Preserve,
        lib: ["es2021"],
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        noEmit: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        preserveWatchOutput: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        sourceMap: false,
        strict: true,
        target: ts.ScriptTarget.ESNext,
        baseUrl: basePath,
    };

    const parsedConfig = ts.parseJsonConfigFileContent(
        compilerOptions,
        ts.sys,
        basePath,
        compilerOptions,
        tsConfigPath ?? undefined,
    );

    const program = ts.createProgram({
        options: parsedConfig.options,
        projectReferences: parsedConfig.projectReferences,
        rootNames: [path.resolve(basePath, input)],
    });

    const dependencies = crawlDependencies(program);

    return dependencies;
};
