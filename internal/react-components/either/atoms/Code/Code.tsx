import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export const Code = forwardRef<HTMLElement, InferComponentProps<"code">>((props, ref) => {
    return (
        <code
            {...props}
            ref={ref}
            className={cn(
                oneLine`
                    border-border/80
                    bg-muted/20
                    rounded-sm
                    border
                    border-solid
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
