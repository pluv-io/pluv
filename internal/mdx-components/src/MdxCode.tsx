import { InferComponentProps } from "@pluv-internal/typings";
import { FC } from "react";
import tw from "twin.macro";

const Root = tw.code`
    font-mono
`;

export type MdxCodeProps = Omit<InferComponentProps<"code">, "ref">;

export const MdxCode: FC<MdxCodeProps> = (props) => {
    return <Root {...props} />;
};
