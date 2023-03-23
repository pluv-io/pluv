import { InferComponentProps } from "@pluv-internal/typings";
import { FC } from "react";
import tw from "twin.macro";

const Root = tw.p`
    my-[0.8em]
`;

export type MdxPProps = Omit<InferComponentProps<"p">, "ref">;

export const MdxP: FC<MdxPProps> = (props) => {
    return <Root {...props} />;
};
