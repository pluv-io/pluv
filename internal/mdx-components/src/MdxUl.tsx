import { InferComponentProps } from "@pluv-internal/typings";
import { FC } from "react";
import tw from "twin.macro";

const Root = tw.ul`
    list-inside
    mb-4
    pl-6
`;

export type MdxUlProps = Omit<InferComponentProps<"ul">, "ref">;

export const MdxUl: FC<MdxUlProps> = (props) => {
    return <Root {...props} />;
};
