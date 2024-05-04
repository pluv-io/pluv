import { InferComponentProps } from "@pluv-internal/typings";
import tw from "twin.macro";

export type MdxBlockQuoteProps = Omit<InferComponentProps<typeof MdxBlockQuote>, "ref">;

export const MdxBlockQuote = tw.blockquote`
    mb-[1.2em]
    pl-3
    py-1
    border-l-2
    border-solid
    border-indigo-500
    [& > p]:my-0
`;
