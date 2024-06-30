import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type BackdropProps = InferComponentProps<"div"> & {
    "data-state"?: "open" | "closed";
};

export const Backdrop = forwardRef<HTMLDivElement, BackdropProps>((props, ref) => {
    const { className } = props;

    return (
        <div
            {...props}
            ref={ref}
            className={cn(
                oneLine`
                    fixed
                    inset-0
                    z-backdrop
                    animate-[backdropShow_0.15s_ease-in]
                    bg-black/80
                    backdrop-blur-lg
                    data-[state=open]:animate-in
                    data-[state=closed]:animate-out
                    data-[state=closed]:fade-out-0
                    data-[state=open]:fade-in-0
                `,
                className,
            )}
        />
    );
});

Backdrop.displayName = "Backdrop";
