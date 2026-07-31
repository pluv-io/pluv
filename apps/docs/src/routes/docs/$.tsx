import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { Suspense } from "react";
import browserCollections from "collections/browser";
import { getMDXComponents } from "@/components/mdx";
import { baseOptions } from "@/lib/layout.shared";
import { createPageHead } from "@/lib/seo";
import { source } from "@/lib/source";

const serverLoader = createServerFn({
    method: "GET",
})
    .validator((slugs: string[]) => slugs)
    .handler(async ({ data: slugs }) => {
        const page = source.getPage(slugs);
        if (!page) throw notFound();

        return {
            path: page.path,
            url: page.url,
            title: page.data.title as string,
            description: page.data.description as string | undefined,
            pageTree: await source.serializePageTree(source.getPageTree()),
        };
    });

const clientLoader = browserCollections.docs.createClientLoader({
    component: ({ toc, frontmatter, default: MDX }) => {
        return (
            <DocsPage toc={toc}>
                <DocsTitle>{frontmatter.title}</DocsTitle>
                <DocsDescription>{frontmatter.description}</DocsDescription>
                <DocsBody>
                    <MDX components={getMDXComponents()} />
                </DocsBody>
            </DocsPage>
        );
    },
});

export const Route = createFileRoute("/docs/$")({
    component: () => {
        return <Page />;
    },
    loader: async ({ params }) => {
        const slugs = params._splat?.split("/") ?? [];
        const data = await serverLoader({ data: slugs });
        await clientLoader.preload(data.path);
        return data;
    },
    head: ({ loaderData }) => {
        if (!loaderData) return {};

        return createPageHead({
            title: loaderData.title,
            description: loaderData.description,
            url: loaderData.url,
            type: "article",
        });
    },
});

const Page = () => {
    const data = useFumadocsLoader(Route.useLoaderData());

    return (
        <DocsLayout {...baseOptions()} tree={data.pageTree}>
            <Suspense>{clientLoader.useContent(data.path)}</Suspense>
        </DocsLayout>
    );
};
