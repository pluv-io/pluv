import { NextLink } from "@pluv-internal/react-components";
import { InferComponentProps } from "@pluv-internal/typings";
import { FC } from "react";
import tw from "twin.macro";

const Root = tw(NextLink)`
    text-sky-500
`;

export type MdxAProps = Omit<InferComponentProps<"a">, "ref">;

export const MdxA: FC<MdxAProps> = (props) => {
    const { href } = props;

    if (!href) return null;

    return <Root {...props} href={href} />;
};
