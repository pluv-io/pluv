import {
    MdxA,
    MdxBlockQuote,
    MdxCode,
    MdxH1,
    MdxH2,
    MdxH3,
    MdxH4,
    MdxH5,
    MdxH6,
    MdxImg,
    MdxLi,
    MdxOl,
    MdxP,
    MdxTable,
    MdxUl,
} from "@pluv-internal/mdx-components";
import type { MDXComponents } from "mdx/types";
import { MdxPre } from "./components/MdxPre";

export function useMDXComponents(mdxComponents: MDXComponents): MDXComponents {
    return {
        ...mdxComponents,
        a: MdxA,
        blockquote: MdxBlockQuote,
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
    };
}
