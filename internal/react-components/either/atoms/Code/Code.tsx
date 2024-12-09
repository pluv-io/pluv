import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export const Code = forwardRef<HTMLElement, ComponentProps<"code">>((props, ref) => {
    return (
        <code
            {...props}
            ref={ref}
            className={cn(
                oneLine`
                    rounded-sm
                    border
                    border-solid
                    border-border/80
                    bg-muted/20
                    px-1
                    py-0.5
                    font-mono
                `,
                props.className,
            )}
        />
    );
});

Code.displayName = "Code";
