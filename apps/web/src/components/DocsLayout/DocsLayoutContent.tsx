import type { InferComponentProps } from "@pluv-internal/typings";
import tw from "twin.macro";

export type DocsLayoutContentProps = InferComponentProps<
    typeof DocsLayoutContent
>;

export const DocsLayoutContent = tw.main`
    grow
`;
