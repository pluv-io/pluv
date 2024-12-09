import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type InputProps = ComponentProps<"input">;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                oneLine`
                    flex
                    h-10
                    w-full
                    rounded-md
                    border
                    border-input
                    bg-background
                    px-3
                    py-2
                    text-sm
                    ring-offset-background
                    file:border-0
                    file:bg-transparent
                    file:text-sm
                    file:font-medium
                    placeholder:text-muted-foreground
                    focus-visible:bg-background
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    focus-visible:ring-offset-2
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    [&[contenteditable]:not(:active)]:border-none
                    [&[contenteditable]:not(:active)]:shadow-none
                    [&[contenteditable]:not(:active)]:outline-none
                    [&[contenteditable]:not(:focus)]:border-none
                    [&[contenteditable]:not(:focus)]:shadow-none
                    [&[contenteditable]:not(:focus)]:outline-none
                    [&[contenteditable]]:border-none
                    [&[contenteditable]]:shadow-none
                    [&[contenteditable]]:outline-none
                `,
                className,
            )}
            ref={ref}
            {...props}
        />
    );
});
Input.displayName = "Input";
