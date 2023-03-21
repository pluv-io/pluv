import { MDXProvider } from "@mdx-js/react";
import type { FC, ReactNode } from "react";
import { MdxA } from "./MdxA";
import { MdxCode } from "./MdxCode";
import { MdxH1 } from "./MdxH1";
import { MdxH2 } from "./MdxH2";
import { MdxH3 } from "./MdxH3";
import { MdxH4 } from "./MdxH4";
import { MdxH5 } from "./MdxH5";
import { MdxH6 } from "./MdxH6";
import { MdxImg } from "./MdxImg";
import { MdxLi } from "./MdxLi";
import { MdxOl } from "./MdxOl";
import { MdxP } from "./MdxP";
import { MdxPre } from "./MdxPre";
import { MdxTable } from "./MdxTable";
import { MdxUl } from "./MdxUl";

export interface MdxProviderProps {
    children?: ReactNode;
}

export const MdxProvider: FC<MdxProviderProps> = ({ children }) => {
    return (
        <MDXProvider
            components={{
                a: MdxA,
                code: MdxCode,
                h1: MdxH1,
                h2: MdxH2,
                h3: MdxH3,
                h4: MdxH4,
                h5: MdxH5,
                h6: MdxH6,
                img: MdxImg,
                li: MdxLi,
                ol: MdxOl,
                p: MdxP,
                pre: MdxPre,
                table: MdxTable,
                ul: MdxUl,
            }}
        >
            {children}
        </MDXProvider>
    );
};
