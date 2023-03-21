import { InferComponentProps } from "@pluv-internal/typings";
import { FC } from "react";
import tw from "twin.macro";

const Root = tw.ol`
    list-decimal
    list-inside
    mb-4
    pl-6
`;

export type MdxOlProps = Omit<InferComponentProps<"ul">, "ref">;

export const MdxOl: FC<MdxOlProps> = (props) => {
    return <Root {...props} />;
};
