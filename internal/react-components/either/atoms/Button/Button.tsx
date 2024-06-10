import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export const buttonVariants = cva(
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
        disabled:cursor-not-allowed
        disabled:opacity-50
    `,
    {
        variants: {
            variant: {
                default: oneLine`
                    bg-button
                    text-button-foreground
                    hover:bg-button/90
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
                link: "text-sky-600 underline-offset-4 hover:text-sky-600 hover:underline",
            },
            size: {
                default: "h-10 gap-1.5 px-4 py-2",
                sm: "h-8 gap-1 rounded-md px-3",
                lg: "h-11 gap-3 rounded-md px-8",
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

export type ButtonProps = InferComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { className, variant, size, asChild } = props;

    const Comp = asChild ? Slot : "button";

    return <Comp {...props} className={cn(buttonVariants({ variant, size, className }))} ref={ref} />;
});

Button.displayName = "Button";
