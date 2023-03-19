import { NextLink } from "../NextLink";
import tw from "twin.macro";
import { InferComponentProps } from "@pluv-internal/typings";

export type AnchorProps = InferComponentProps<typeof Anchor>;

export const Anchor = tw(NextLink)`
    hover:text-sky-500
    hover:underline
`;