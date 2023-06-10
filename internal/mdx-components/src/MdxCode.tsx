import { InferComponentProps } from "@pluv-internal/typings";
import { ReactElement } from "react";
import tw from "twin.macro";

const Root = tw.code`
    p-0.5
    border
    border-indigo-500/40
    rounded-md
    font-mono
    bg-zinc-800
`;

export type MdxCodeProps = Omit<InferComponentProps<"code">, "ref">;

export const MdxCode = (props: MdxCodeProps): ReactElement | null => {
    return <Root {...props} />;
};
