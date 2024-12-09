import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export const buttonVariants = cva(
    oneLine`
        inline-flex
        items-center
        justify-center
        whitespace-nowrap
        rounded-md
        text-sm
        font-medium
        ring-offset-background
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-ring
        focus-visible:ring-offset-2
        disabled:cursor-not-allowed
        disabled:opacity-50
    `,
    {
        variants: {
            variant: {
                default: oneLine`
                    bg-button
                    text-button-foreground
                    shadow
                    hover:bg-button/90
                `,
                destructive: oneLine`
                    hover:bg-destructive/90"
                    bg-destructive
                    text-destructive-foreground
                    shadow-sm
                `,
                outline: oneLine`
                    border
                    border-input
                    bg-background
                    shadow-sm
                    hover:bg-accent
                    hover:text-accent-foreground
                `,
                secondary: oneLine`
                    bg-secondary
                    text-secondary-foreground
                    shadow-sm
                    hover:bg-secondary/80
                `,
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-sky-600 underline-offset-4 hover:text-sky-600 hover:underline",
            },
            size: {
                default: "h-10 gap-1.5 px-4 py-2",
                sm: "h-8 gap-1 rounded-md px-3 py-1",
                lg: "h-11 gap-3 rounded-md px-8 py-2.5",
                icon: "h-10 w-10",
                "icon-sm": "h-6 w-6 rounded-sm",
                link: "",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { className, variant, size, asChild, ...restProps } = props;

    const Comp = asChild ? Slot : "button";

    return <Comp {...restProps} className={cn(buttonVariants({ variant, size, className }))} ref={ref} />;
});

Button.displayName = "Button";
