import { InferComponentProps } from "@pluv-internal/typings";
import { ReactElement } from "react";
import tw from "twin.macro";

const Root = tw.li`
    mb-1
    [& > ul]:mt-1
    [& > ol]:mt-1
`;

export type MdxLiProps = Omit<InferComponentProps<"li">, "ref">;

export const MdxLi = (props: MdxLiProps): ReactElement | null => {
    return <Root {...props} />;
};
