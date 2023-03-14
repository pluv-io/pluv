import type { InferComponentProps } from "@pluv-internal/typings";
import tw, { styled } from "twin.macro";
import { getZIndex } from "../../z-indices";

export type AppBarProps = InferComponentProps<typeof AppBar>;

export const AppBar = styled.div`
    ${tw`
        sticky
        top-0
        w-full
        min-h-[4rem]
        py-2
        px-4
        shadow-lg
        shadow-indigo-800
        border-b
        border-solid
        border-indigo-700/60
        bg-zinc-800
    `}
    z-index: ${getZIndex("app-bar")};
`;
