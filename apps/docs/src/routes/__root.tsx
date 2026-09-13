import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import { SITE_NAME } from "@/constants";
import appCss from "@/styles/app.css?url";
import { createPageHead } from "@/lib/seo";

const rootHead = createPageHead({
    title: SITE_NAME,
    url: "/docs",
});

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
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            ...rootHead.meta,
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "icon", href: "/pluv-icon.png", type: "image/png" },
            { rel: "apple-touch-icon", href: "/pluv-icon.png" },
        ],
    }),
    component: RootComponent,
});
