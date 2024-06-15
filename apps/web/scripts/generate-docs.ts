import fs from "fs-extra";
import { sync } from "glob";
import path from "path";

const MAX_ORDER = 9999;

const srcPath = path.resolve(__dirname, "../src");
const sourcePath = path.resolve(srcPath, "inputs/docs");
const outputDocs = path.resolve(srcPath, "app/docs");
const outputRoutes = path.resolve(srcPath, "generated/doc-routes.json");

const getFilePaths = (): readonly string[] => {
    return sync(`${sourcePath}/**/*.mdx`).sort((a, b) => a.localeCompare(b));
};

const normalize = (filePath: string): string => {
    return filePath.replace(sourcePath, "").replace(/^\//, "");
};

const removeExt = (filePath: string): string => {
    return filePath.replace(path.extname(filePath), "");
};

const toRouteSlug = (fileName: string): string => {
    return normalize(fileName)
        .replace(/^@pluv_/, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-\.]/g, "")
        .toLowerCase();
};

const toRoute = (filePath: string): string => {
    const normalized = normalize(filePath).split("/").map(toRouteSlug).join("/");

    const split = normalized.split("--");

    return split.length === 1 ? split[0] : split[1];
};

const generateDocPages = (): void => {
    const filePaths = getFilePaths();

    fs.ensureDirSync(outputDocs);

    const contents = fs.readdirSync(outputDocs).map((fileName) => path.join(outputDocs, fileName));

    contents.forEach((fileOrDirPath) => {
        const stat = fs.statSync(fileOrDirPath);
        const isMdx = path.extname(fileOrDirPath) === ".mdx";

        if (stat.isFile() && !isMdx) return;

        fs.rmSync(fileOrDirPath, { recursive: true });
    });

    filePaths.forEach((filePath) => {
        const route = toRoute(filePath);

        const outputPath = `${outputDocs}/${route}/page.mdx`;

        fs.ensureFileSync(outputPath);
        fs.copyFileSync(filePath, outputPath);
    });
};

const formatName = (name: string): string => {
    return name.replace(/^@pluv_/, "@pluv/");
};

interface RouteNode {
    name: string;
    order: number;
    children: Record<string, RouteNode>;
}

const generateRoutes = (): void => {
    const filePaths = getFilePaths();

    const toRouteNode = (filePath: string): Record<string, RouteNode> => {
        const [normalized, ...parts] = normalize(filePath).split("/");

        if (!normalized) return {};

        const withoutExt = removeExt(normalized);
        const split = withoutExt.split("--");

        const order = split.length === 1 ? MAX_ORDER : parseInt(split[0], 10);
        const rawName = split.length === 1 ? split[0] : split[1];
        const name = formatName(rawName);
        const slug = toRouteSlug(rawName);

        return {
            [slug]: {
                name,
                order,
                children: toRouteNode(parts.join("/")),
            },
        };
    };

    const output = filePaths
        .map((filePath) => toRouteNode(filePath))
        .reduce<Record<string, RouteNode>>((acc1, nodes) => {
            return Object.entries(nodes).reduce(
                (acc2, [slug, node]) => ({
                    ...acc2,
                    [slug]: {
                        ...node,
                        children: {
                            ...acc2[slug]?.children,
                            ...node.children,
                        },
                    },
                }),
                acc1,
            );
        }, {});

    fs.ensureFileSync(outputRoutes);
    fs.writeFileSync(outputRoutes, JSON.stringify(output, null, 4));
};

const main = (): void => {
    const filePaths = sync(`${sourcePath}/**/*.mdx`)
        .sort((a, b) => a.localeCompare(b))
        .map(normalize);

    console.log("Files", filePaths);

    generateDocPages();
    generateRoutes();
};

main();
