import { InferComponentProps } from "@pluv-internal/typings";
import { CSSProperties, FC, ReactNode } from "react";
import tw from "twin.macro";

const Root = tw.li`
    mb-1
`;

export type MdxLiProps = Omit<InferComponentProps<"li">, "ref">;

export const MdxLi: FC<MdxLiProps> = (props) => {
    return <Root {...props} />;
};
