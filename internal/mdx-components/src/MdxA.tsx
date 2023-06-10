import { NextLink } from "@pluv-internal/react-components";
import { useNoSsr } from "@pluv-internal/react-hooks";
import { InferComponentProps } from "@pluv-internal/typings";
import { ReactElement } from "react";
import tw from "twin.macro";

const Root = tw(NextLink)`
    text-sky-500
`;

export type MdxAProps = Omit<InferComponentProps<"a">, "ref">;

export const MdxA = (props: MdxAProps): ReactElement | null => {
    const { href } = props;

    const noSsr = useNoSsr();

    const isExternal = noSsr(() => {
        if (!href) return true;
        if (/^http(s)?:\/\//.test(href)) return !href.startsWith(window.origin);

        return false;
    });

    const rel = props.rel ?? isExternal ? "noopener noreferrer" : undefined;
    const target = props.target ?? isExternal ? "_blank" : undefined;

    if (!href) return null;

    return <Root {...props} href={href} rel={rel} target={target} />;
};
