import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import type { VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { buttonVariants } from "../Button/Button";
import { NextLink } from "../NextLink";

export type AnchorButtonProps = InferComponentProps<typeof NextLink> & VariantProps<typeof buttonVariants>;

export const AnchorButton = forwardRef<HTMLAnchorElement, AnchorButtonProps>((props, ref) => {
    const { bounce, className, outlined, size, square, variant, ...restProps } = props;

    return (
        <NextLink
            {...restProps}
            ref={ref}
            className={cn(buttonVariants({ bounce, outlined, size, square, variant }), className)}
        />
    );
});

AnchorButton.displayName = "Button";
