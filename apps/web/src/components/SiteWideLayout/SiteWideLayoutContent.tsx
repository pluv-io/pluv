import type { InferComponentProps } from "@pluv-internal/typings";
import tw from "twin.macro";

export type SiteWideLayoutContentProps = InferComponentProps<
    typeof SiteWideLayoutContent
>;

export const SiteWideLayoutContent = tw.main`
    grow
`;
