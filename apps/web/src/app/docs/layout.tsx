import type { ServerRuntime } from "next";
import type { FC, ReactNode } from "react";
import { DocsLayout } from "../../components/DocsLayout";

export const runtime: ServerRuntime = "nodejs";

export interface LayoutProps {
    children?: ReactNode;
}

const Layout: FC<LayoutProps> = async ({ children }) => {
    return <DocsLayout>{children}</DocsLayout>;
};

export default Layout;
