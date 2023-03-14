import type { InferComponentProps } from "@pluv-internal/typings";
import tw from "twin.macro";

export type FooterProps = InferComponentProps<typeof Footer>;

export const Footer = tw.footer`
	w-full
	h-24
    px-4
    shadow-lg
    shadow-indigo-800
    border-t
    border-solid
    border-indigo-700/60
    bg-zinc-800
`;
