const SITE_NAME = "pluv.io Docs";
const SITE_URL = "https://pluv.io";
const DEFAULT_DESCRIPTION =
    "Type-safe realtime primitives for multiplayer apps. Self-host on Cloudflare Workers or Node.js, or use the pluv.io network.";

export function createPageHead({
    title,
    description,
    url,
    type = "website",
}: {
    title: string;
    description?: string;
    url?: string;
    type?: "website" | "article";
}) {
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    const metaDescription = description?.trim() || DEFAULT_DESCRIPTION;
    const pageUrl = url ? `${SITE_URL}${url}` : undefined;

    return {
        meta: [
            { title: fullTitle },
            { name: "description", content: metaDescription },
            { property: "og:title", content: fullTitle },
            { property: "og:description", content: metaDescription },
            { property: "og:site_name", content: SITE_NAME },
            { property: "og:type", content: type },
            ...(pageUrl ? [{ property: "og:url", content: pageUrl }] : []),
            { name: "twitter:card", content: "summary" },
            { name: "twitter:title", content: fullTitle },
            { name: "twitter:description", content: metaDescription },
        ],
    };
}

export { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL };
