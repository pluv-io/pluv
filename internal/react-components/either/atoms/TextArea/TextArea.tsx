import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type TextAreaProps = InferComponentProps<"textarea">;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                oneLine`
                    border-input
                    bg-background
                    ring-offset-background
                    placeholder:text-muted-foreground
                    focus-visible:ring-ring
                    flex
                    min-h-[80px]
                    w-full
                    rounded-md
                    border
                    px-3
                    py-2
                    text-sm
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
TextArea.displayName = "TextArea";
