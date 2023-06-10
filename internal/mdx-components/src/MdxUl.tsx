import { InferComponentProps } from "@pluv-internal/typings";
import { ReactElement } from "react";
import tw from "twin.macro";

const Root = tw.ul`
    list-disc
    list-inside
    mb-4
    pl-6
`;

export type MdxUlProps = Omit<InferComponentProps<"ul">, "ref">;

export const MdxUl = (props: MdxUlProps): ReactElement | null => {
    return <Root {...props} />;
};
