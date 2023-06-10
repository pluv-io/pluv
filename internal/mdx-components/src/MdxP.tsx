import { InferComponentProps } from "@pluv-internal/typings";
import { ReactElement } from "react";
import tw from "twin.macro";

const Root = tw.p`
    my-[0.8em]
`;

export type MdxPProps = Omit<InferComponentProps<"p">, "ref">;

export const MdxP = (props: MdxPProps): ReactElement | null => {
    return <Root {...props} />;
};
