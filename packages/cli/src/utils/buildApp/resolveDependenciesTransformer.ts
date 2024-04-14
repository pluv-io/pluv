import { ProgramTransformerFactory } from "@rollup/plugin-typescript";
import path from "node:path";
import type { SourceFile, TransformerFactory } from "typescript";
import ts from "typescript";

const resolveDependencies = (entryFilePath: string): string[] => {
    const dependencies = new Set<string>();
    const visited = new Set<string>();

    const visit = (filePath: string) => {
        if (visited.has(filePath)) return;

        visited.add(filePath);

        const sourceText = ts.sys.readFile(filePath);

        if (!sourceText) return;

        let sourceFile: SourceFile = ts.createSourceFile(
            filePath,
            sourceText,
            ts.ScriptTarget.ESNext,
            true,
        );

        if (!sourceFile) return;

        ts.forEachChild(sourceFile, (node) => {
            if (!ts.isImportDeclaration(node)) return;

            const importPath = node.moduleSpecifier.getText();
            const absolutePath = path.resolve(
                path.dirname(filePath),
                importPath,
            );

            dependencies.add(importPath);

            visit(absolutePath);
        });
    };

    visit(entryFilePath);

    return Array.from(dependencies.values());
};

export const resolveDependenciesTransformer: ProgramTransformerFactory<"before"> =
    {
        type: "program",
        factory: (program): TransformerFactory<ts.SourceFile> => {
            return (context) => {
                return (node) => {
                    const dependencies = resolveDependencies(node.fileName);

                    dependencies.forEach((dependency) => {
                        const sourceFile = program.getSourceFile(dependency);

                        try {
                            program.emit(sourceFile);
                        } catch {}
                    });

                    return node;
                };
            };
        },
    };
