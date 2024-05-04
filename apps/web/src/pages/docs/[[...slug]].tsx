import fs from "fs-extra";
import matter from "gray-matter";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import path from "path";
import tw from "twin.macro";
import { DocsCard, DocsLayout } from "../../components";
import docRoutes from "../../generated/doc-routes.json";
import { DocRoutes, MetaJson } from "../../types";

const Heading = tw.h1`
    mb-6
`;

const Contents = tw.div`
    grid
    [grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr))]
    gap-8
    w-full
`;

const Card = tw(DocsCard)`
    min-w-0
`;

export interface DocsIndexChild {
    data: MetaJson;
    name: string;
    route: string;
}

const routes: DocRoutes = docRoutes;

const Page: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ children, meta }) => {
    return (
        <DocsLayout meta={meta}>
            <Heading>{meta?.title}</Heading>
            <Contents>
                {children?.map((child) => (
                    <Card
                        key={child.route}
                        description={child.data.description}
                        href={child.route}
                        title={child.data.title}
                    />
                ))}
            </Contents>
        </DocsLayout>
    );
};

const getFolderRoutes = (candidates: DocRoutes): readonly string[] => {
    return Object.entries(candidates).reduce<readonly string[]>((acc, [slug, node]) => {
        const isFolder = !!Object.keys(node.children).length;
        const children = getFolderRoutes(node.children).map((nested) => `${slug}/${nested}`);

        return isFolder ? [...acc, slug, ...children] : acc;
    }, []);
};

const getSourcePath = (slugs: readonly string[], candidates: DocRoutes): string => {
    const [slug, ...rest] = slugs;

    if (!slug) return "";

    const node = candidates[slug];

    const prefix = node.name.replace(/^@pluv\//, "@pluv_");
    const suffix = getSourcePath(rest, node.children);

    return suffix ? `${prefix}/${suffix}` : prefix;
};

const getMetaJson = (source: string): MetaJson | null => {
    const contents = fs.readFileSync(path.resolve(source, "./meta.json"), {
        encoding: "utf-8",
    });

    try {
        return JSON.parse(contents) as MetaJson;
    } catch {
        return null;
    }
};

export const getStaticPaths: GetStaticPaths<{ slug?: string[] }> = () => {
    const folderRoutes = getFolderRoutes(routes);

    return {
        paths: [
            { params: { slug: [] } },
            ...folderRoutes.map((route) => ({
                params: { slug: route.split("/") },
            })),
        ],
        fallback: false,
    };
};

export const getStaticProps: GetStaticProps<
    { children: readonly DocsIndexChild[]; meta: MetaJson | null },
    { slug?: string[] }
> = (context) => {
    const dirname = path.resolve(process.cwd(), "./src/inputs/docs");
    const slugs = context.params?.slug ?? [];
    const source = path.resolve(dirname, `./${getSourcePath(slugs, routes)}`);
    const meta = getMetaJson(source);

    const children = fs
        .readdirSync(source)
        .map((fileOrDirPath) => path.join(source, fileOrDirPath))
        .filter((fileOrDirPath) => {
            const stat = fs.statSync(fileOrDirPath);
            const isMdx = path.extname(fileOrDirPath) === ".mdx";

            return stat.isFile() && isMdx;
        })
        .map((filePath) => {
            const contents = fs.readFileSync(filePath, { encoding: "utf-8" });
            const data = (matter(contents).data ?? null) as MetaJson | null;
            const name = filePath.replace(path.extname(filePath), "").replace(source, "").replace(/^\//, "");
            const slug = name
                .replace(/\s+/g, "-")
                .replace(/[^a-zA-Z0-9-\.]/g, "")
                .toLowerCase();
            const route = `/docs/${[...slugs, slug].join("/")}`;

            return { data, name, route };
        })
        .filter(({ data }) => !!data) as readonly DocsIndexChild[];

    return {
        props: {
            children,
            meta,
        },
    };
};

export default Page;
