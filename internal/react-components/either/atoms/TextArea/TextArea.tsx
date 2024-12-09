import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

export type TextAreaProps = ComponentProps<"textarea">;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                oneLine`
                    flex
                    min-h-[80px]
                    w-full
                    rounded-md
                    border
                    border-input
                    bg-background
                    px-3
                    py-2
                    text-sm
                    ring-offset-background
                    placeholder:text-muted-foreground
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
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
TextArea.displayName = "TextArea";
