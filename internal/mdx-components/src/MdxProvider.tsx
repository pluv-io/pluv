import { MDXProvider } from "@mdx-js/react";
import type { FC, ReactNode } from "react";
import { components } from "./components";

export interface MdxProviderProps {
    children?: ReactNode;
}

export const MdxProvider: FC<MdxProviderProps> = ({ children }) => {
    return <MDXProvider components={components}>{children}</MDXProvider>;
};
