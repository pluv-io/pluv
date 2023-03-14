import { InferComponentProps } from "@pluv-internal/typings";
import Link, { LinkProps } from "next/link";
import { forwardRef } from "react";

export type NextLinkProps = Omit<LinkProps, "as"> &
    Omit<InferComponentProps<"a">, keyof LinkProps>;

export const NextLink = forwardRef<HTMLAnchorElement, NextLinkProps>(
    (props, ref) => {
        return <Link {...props} ref={ref} />;
    }
);

NextLink.displayName = "NextLink";
