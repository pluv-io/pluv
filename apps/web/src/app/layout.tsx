import { LazyMotion, PageProgressBar, ThemeProvider, Toaster } from "@pluv-internal/react-components/client";
import type { ServerRuntime } from "next";
import { Inter } from "next/font/google";
import type { FC, ReactNode } from "react";
import { SiteWideLayout } from "../components/SiteWideLayout";

import "@pluv-internal/react-code/styles.css";
import "@pluv-internal/react-components/styles.css";
import "../styles/global.css";

export const runtime: ServerRuntime = "edge";

const inter = Inter({ subsets: ["latin"], display: "swap" });

interface LayoutProps {
    children?: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
    return (
        <html className={inter.className} lang="en" suppressHydrationWarning>
            <head>
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="manifest" href="/site.webmanifest" />
                <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3730a3" />
                <meta name="msapplication-TileColor" content="#3730a3" />
                <meta name="theme-color" content="#3730a3" />
            </head>
            <body>
                <PageProgressBar />
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <LazyMotion>
                        <SiteWideLayout className={inter.className}>{children}</SiteWideLayout>
                    </LazyMotion>
                </ThemeProvider>
                <Toaster />
            </body>
        </html>
    );
};

export default Layout;
