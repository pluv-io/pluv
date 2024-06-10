import { NextLink } from "@pluv-internal/react-components/either";
import { useNoSsr } from "@pluv-internal/react-hooks";
import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type MdxAProps = Omit<InferComponentProps<"a">, "ref">;

export const MdxA = forwardRef<HTMLAnchorElement, MdxAProps>((props) => {
    const { className, href } = props;

    const noSsr = useNoSsr();

    const isExternal = noSsr(() => {
        if (!href) return true;
        if (/^http(s)?:\/\//.test(href)) return !href.startsWith(window.origin);

        return false;
    }, false);

    const rel = props.rel ?? isExternal ? "noopener noreferrer" : undefined;
    const target = props.target ?? isExternal ? "_blank" : undefined;

    if (!href) return null;

    return <NextLink {...props} className={cn("text-sky-500", className)} href={href} rel={rel} target={target} />;
});

MdxA.displayName = "MdxA";
