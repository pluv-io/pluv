import fs from "fs-extra";
import { globSync } from "glob";
import path from "path";

const srcPath = path.resolve(__dirname, "../src");
const sourcePath = path.resolve(srcPath, "inputs/docs");
const outputDocs = path.resolve(srcPath, "pages/docs");
const outputRoutes = path.resolve(srcPath, "generated/doc-routes.json");

const getFilePaths = (): readonly string[] => {
    return globSync(`${sourcePath}/**/*.mdx`).sort((a, b) =>
        a.localeCompare(b)
    );
};

const normalize = (filePath: string): string => {
    return filePath.replace(sourcePath, "").replace(/^\//, "");
};

const removeExt = (filePath: string): string => {
    return filePath.replace(path.extname(filePath), "");
};

const toRouteSlug = (fileName: string): string => {
    return normalize(fileName)
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-\.]/g, "")
        .toLowerCase();
};

const toRoute = (filePath: string): string => {
    return normalize(filePath).split("/").map(toRouteSlug).join("/");
};

const generateDocPages = (): void => {
    const filePaths = getFilePaths();

    fs.ensureDirSync(outputDocs);

    const contents = fs
        .readdirSync(outputDocs)
        .map((fileName) => path.join(outputDocs, fileName));

    contents.forEach((fileOrDirPath) => {
        const stat = fs.statSync(fileOrDirPath);
        const isMdx = path.extname(fileOrDirPath) === ".mdx";

        if (stat.isFile() && !isMdx) return;

        fs.rmSync(fileOrDirPath, { recursive: true });
    });

    filePaths.forEach((filePath) => {
        const route = toRoute(filePath);

        fs.ensureFileSync(`${outputDocs}/${route}`);
        fs.copyFileSync(filePath, `${outputDocs}/${route}`);
    });
};

interface RouteNode {
    name: string;
    children: Record<string, RouteNode>;
}

const generateRoutes = (): void => {
    const filePaths = getFilePaths();

    const toRouteNode = (
        filePath: string
    ): null | [slug: string, node: RouteNode] => {
        const [normalized, ...parts] = normalize(filePath).split("/");

        if (!normalized) return null;

        const name = removeExt(normalized);
        const slug = toRouteSlug(name);
        const result = toRouteNode(parts.join("/"));
        const children = result ? { [result[0]]: result[1] } : {};

        return [slug, { name, children }];
    };

    const output = filePaths.reduce((acc, filePath, i) => {
        const result = toRouteNode(filePath);

        if (!result) return acc;

        const [slug, node] = result;
        const parts = normalize(filePath).replace(/\s+/g, "-").split("/");
        const name = node.name;

        const prefixed = parts.length > 1 ? `@pluv/${name}` : name;

        return {
            ...acc,
            [slug]: {
                ...node,
                name: prefixed,
                children: {
                    ...acc[slug]?.children,
                    ...node.children,
                },
            },
        };
    }, {} as Record<string, RouteNode>);

    fs.ensureFileSync(outputRoutes);
    fs.writeFileSync(outputRoutes, JSON.stringify(output, null, 4));
};

const main = (): void => {
    const filePaths = globSync(`${sourcePath}/**/*.mdx`)
        .sort((a, b) => a.localeCompare(b))
        .map(normalize);

    console.log("Files", filePaths);

    generateDocPages();
    generateRoutes();
};

main();
