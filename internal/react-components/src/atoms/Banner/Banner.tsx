import { InferComponentProps } from "@pluv-internal/typings";
import tw from "twin.macro";

export type BannerProps = InferComponentProps<typeof Banner>;

export const Banner = tw.div`
    flex
    flex-row
    items-center
    justify-center
    w-full
    py-2
    px-4
    border-b
    border-solid
    border-zinc-800
    bg-indigo-700
    text-white
    text-center
    text-sm
`;
