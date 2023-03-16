import { InferComponentProps } from "@pluv-internal/typings";
import tw from "twin.macro";

export type SideBarProps = InferComponentProps<typeof SideBar>;

export const SideBar = tw.aside`
    sticky
    inset-y-0
    left-0
    w-80
    max-w-[90vw]
    max-h-screen
    border-r
    border-solid
    border-indigo-700/60
`;
