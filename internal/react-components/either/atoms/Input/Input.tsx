import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type InputProps = InferComponentProps<"input">;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                oneLine`
                    border-input
                    bg-background
                    ring-offset-background
                    placeholder:text-muted-foreground
                    focus-visible:ring-ring
                    flex
                    h-10
                    w-full
                    rounded-md
                    border
                    px-3
                    py-2
                    text-sm
                    file:border-0
                    file:bg-transparent
                    file:text-sm
                    file:font-medium
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-offset-2
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                `,
                className,
            )}
            ref={ref}
            {...props}
        />
    );
});
Input.displayName = "Input";
