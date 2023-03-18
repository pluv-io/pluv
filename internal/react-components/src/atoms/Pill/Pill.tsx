import { InferComponentProps } from "@pluv-internal/typings";
import tw from "twin.macro";

export type PillProps = InferComponentProps<typeof Pill>;

export const Pill = tw.div`
    inline-flex
    flex-row
    items-center
    px-3
    h-7
    rounded-full
    bg-zinc-700/60
    text-sm
    transition-colors
    duration-150
    ease-in
    [&[href]]:cursor-pointer
    [&[href]]:hover:bg-zinc-700
`;
