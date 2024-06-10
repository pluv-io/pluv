import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { oneLine } from "common-tags";
import NextLink from "next/link";
import { forwardRef } from "react";

const anchorVariants = cva(
    oneLine`
        ring-offset-background
        focus-visible:ring-ring
        inline-flex
        items-center
        justify-center
        whitespace-nowrap
        rounded-md
        text-sm
        font-medium
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-offset-2
        disabled:pointer-events-none
        disabled:opacity-50
    `,
    {
        variants: {
            variant: {
                default: oneLine`
                    bg-primary
                    text-primary-foreground
                    hover:bg-primary/90
                `,
                destructive: oneLine`
                    hover:bg-destructive/90"
                    bg-destructive
                    text-destructive-foreground
                `,
                outline: oneLine`
                    border-input
                    bg-background
                    hover:bg-accent
                    hover:text-accent-foreground
                    border
                `,
                secondary: oneLine`
                    bg-secondary
                    text-secondary-foreground
                    hover:bg-secondary/80
                `,
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 gap-1.5 px-4 py-2",
                sm: "h-9 gap-1 rounded-md px-3",
                lg: "h-11 gap-3 rounded-md px-8",
                icon: "h-8 w-8",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export type AnchorButtonProps = InferComponentProps<typeof NextLink> &
    VariantProps<typeof anchorVariants> & { asChild?: boolean };

export const AnchorButton = forwardRef<HTMLAnchorElement, AnchorButtonProps>((props, ref) => {
    const { as: _as, className, href, variant, size, asChild } = props;

    const Comp = asChild ? Slot : NextLink;

    return (
        <Comp
            {...props}
            as={_as as string}
            href={href as string}
            className={cn(anchorVariants({ variant, size, className }))}
            ref={ref}
        />
    );
});

AnchorButton.displayName = "AnchorButton";
