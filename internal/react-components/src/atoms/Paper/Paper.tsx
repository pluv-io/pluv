import { InferComponentProps } from "@pluv-internal/typings";
import tw from "twin.macro";

export type PaperProps = InferComponentProps<typeof Paper>;

export const Paper = tw.div`
    block
    rounded
    shadow-2xl
    border
    border-solid
    border-transparent
    bg-zinc-800
    transition
    duration-150
    ease-in
    [&[href]]:cursor-pointer
    [&[href]]:hover:border-sky-500
`;
