import { oneLine } from "common-tags";
import type { Metadata, ResolvingMetadata, ServerRuntime } from "next";
import type { FC } from "react";
import { DocsCard } from "../../../components/DocsCard";
import docRoutes from "../../../generated/doc-routes.json";
import type { DocRoutes, MetaJson } from "../../../types";

const OG_TTL = 345600;

const routes: DocRoutes = docRoutes;

export const runtime: ServerRuntime = "nodejs";

type StaticParams = ReturnType<typeof generateStaticParams>[number];
interface DocsIndexChild {
    data: MetaJson;
    name: string;
    route: string;
}

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

const getMetaData = async (params: StaticParams): Promise<MetaJson | null> => {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const fs = await import("fs-extra");
        const { resolve } = await import("path");

        const slugs = params.slug;
        const dirname = resolve(process.cwd(), "./src/inputs/docs");
        const source = resolve(dirname, `./${getSourcePath(slugs, routes)}`);

        const contents = fs.readFileSync(resolve(source, "./meta.json"), {
            encoding: "utf-8",
        });

        try {
            return JSON.parse(contents) as MetaJson;
        } catch {
            return null;
        }
    }

    throw new Error("Wrong runtime");
};

const getDocsProps = async (params: StaticParams) => {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const fs = await import("fs-extra");
        const { extname, join, resolve } = await import("path");

        const slugs = params.slug;
        const dirname = resolve(process.cwd(), "./src/inputs/docs");
        const source = resolve(dirname, `./${getSourcePath(slugs, routes)}`);
        const meta = await getMetaData(params);

        const docs = fs
            .readdirSync(source)
            .map((fileOrDirPath) => join(source, fileOrDirPath))
            .filter((fileOrDirPath) => {
                const stat = fs.statSync(fileOrDirPath);
                const isMdx = extname(fileOrDirPath) === ".mdx";

                return stat.isFile() && isMdx;
            })
            .map((filePath) => {
                const contents = fs.readFileSync(filePath, { encoding: "utf-8" });

                /**
                 * !HACK
                 * @description Very manual hack to parse the metadata export out of the markdown
                 * file. Because I'm too lazy to fix this more reasonably.
                 * @date June 29, 2024
                 */
                const match =
                    contents
                        .match(/^export const metadata = ([\s\S]*?,?\n};)/i)?.[1]
                        ?.replace(/,\n};/i, "\n}")
                        .replace("title:", '"title":')
                        .replace("description:", '"description":') ?? null;

                const data = (match ? JSON.parse(match) : null) as MetaJson | null;
                const name = filePath.replace(extname(filePath), "").replace(source, "").replace(/^\//, "");
                const slug = name
                    .replace(/\s+/g, "-")
                    .replace(/[^a-zA-Z0-9-\.]/g, "")
                    .toLowerCase();
                const route = `/docs/${[...slugs, slug].join("/")}`;

                return { data, name, route };
            })
            .filter(({ data }) => !!data) as readonly DocsIndexChild[];

        return { docs, meta };
    }

    throw new Error("Wrong runtime");
};

export const generateStaticParams = () => {
    const folderRoutes = getFolderRoutes(routes);

    return folderRoutes.map((route) => ({
        slug: route.split("/"),
    }));
};

export const generateMetadata = async ({ params }: LayoutProps, parent: ResolvingMetadata): Promise<Metadata> => {
    const meta = await getMetaData(params);

    const parentMetaData = await parent;

    const image = parentMetaData.openGraph?.images?.[0] ?? undefined;
    const images = image ? [image] : [];
    const title = `${meta?.title ?? parentMetaData.title} – pluv.io`;
    const description = meta?.description ?? parentMetaData.description ?? undefined;

    return {
        title,
        description,
        openGraph: {
            description,
            images,
            locale: "en-US",
            siteName: "pluv.io",
            title,
            ttl: OG_TTL,
        },
        robots: { index: true, follow: true },
        twitter: {
            card: "summary_large_image",
            description,
            images,
            title,
        },
    };
};

export interface LayoutProps {
    params: StaticParams;
}

const Layout: FC<LayoutProps> = async ({ params }) => {
    const { docs, meta } = await getDocsProps(params);

    return (
        <>
            <h1 className="mb-6">{meta?.title}</h1>
            <div
                className={oneLine`
                    grid
                    w-full
                    grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]
                    gap-8
                `}
            >
                {docs?.map((child) => (
                    <DocsCard
                        key={child.route}
                        className="min-w-0"
                        description={child.data.description}
                        href={child.route}
                        title={child.data.title}
                    />
                ))}
            </div>
        </>
    );
};

export default Layout;
