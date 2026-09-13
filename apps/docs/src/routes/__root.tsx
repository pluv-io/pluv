import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import appCss from "@/styles/app.css?url";
import { createPageHead, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";

const RootComponent = () => {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body className="flex min-h-screen flex-col">
                <RootProvider>
                    <Outlet />
                </RootProvider>
                <Scripts />
            </body>
        </html>
    );
};

export const Route = createRootRoute({
    head: () => {
        const pageHead = createPageHead({
            title: SITE_NAME,
            description: DEFAULT_DESCRIPTION,
            url: "/docs",
            siteUrl: getSiteUrl(),
        });

        return {
            meta: [
                { charSet: "utf-8" },
                {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1",
                },
                ...pageHead.meta,
            ],
            links: [
                { rel: "stylesheet", href: appCss },
                { rel: "icon", href: "/pluv-icon.png", type: "image/png" },
                { rel: "apple-touch-icon", href: "/pluv-icon.png" },
            ],
        };
    },
    component: RootComponent,
});
