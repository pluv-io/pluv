import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type ButtonVariant = "alert" | "error" | "primary" | "secondary" | "success";

export type ButtonProps = InferComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export const buttonVariants = cva(
    oneLine`
        not-disabled:active:shadow-none
        not-disabled:hover:shadow-md
        not-disabled:hover:opacity-80
        not-disabled:hover:border-opacity-100
        relative
        flex
        transform
        cursor-pointer
        items-center
        justify-center
        border
        border-solid
        border-transparent
        border-opacity-40
        font-semibold
        leading-snug
        shadow-sm
        transition
        duration-150
        ease-in-out
        disabled:cursor-not-allowed
        disabled:opacity-60
        disabled:shadow-none
        disabled:after:pointer-events-auto
        disabled:after:absolute
        disabled:after:inset-0
        disabled:after:cursor-not-allowed
    `,
    {
        variants: {
            bounce: { true: "not-disabled:hover:-translate-y-0.5", false: "" },
            outlined: { true: "", false: "" },
            size: {
                small: "rounded text-base",
                medium: "rounded-md text-lg",
                large: "rounded-md text-lg font-bold",
            },
            square: { true: "", false: "" },
            variant: { alert: "", error: "", primary: "", secondary: "", success: "" },
        },
        defaultVariants: {
            bounce: true,
        },
        compoundVariants: [
            { outlined: true, variant: "alert", className: "border-pink-600" },
            { outlined: false, variant: "alert", className: "bg-pink-600 text-white" },
            { outlined: true, variant: "error", className: "border-rose-600" },
            { outlined: false, variant: "error", className: "bg-rose-600 text-white" },
            { outlined: true, variant: "primary", className: "border-sky-500" },
            { outlined: false, variant: "primary", className: "bg-sky-500 text-black" },
            { outlined: true, variant: "secondary", className: "border-amber-400" },
            { outlined: false, variant: "secondary", className: "bg-amber-400 text-black" },
            { outlined: true, variant: "success", className: "border-emerald-500" },
            { outlined: false, variant: "success", className: "bg-emerald-500 text-black" },
            { size: "small", square: true, className: "p-1" },
            { size: "small", square: false, className: "px-1.5 py-1" },
            { size: "medium", square: true, className: "p-2" },
            { size: "medium", square: false, className: "px-2.5 py-2" },
            { size: "large", square: true, className: "p-3.5" },
            { size: "large", square: false, className: "px-4 py-3.5" },
        ],
    },
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const {
        bounce,
        className,
        outlined,
        role = "button",
        size,
        square,
        type = "button",
        variant,
        ...restProps
    } = props;

    return (
        <button
            {...restProps}
            ref={ref}
            className={cn(buttonVariants({ bounce, outlined, size, square, variant }), className)}
            role={role}
            type={type}
        />
    );
});

Button.displayName = "Button";
