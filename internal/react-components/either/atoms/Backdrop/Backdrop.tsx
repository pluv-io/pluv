import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type BackdropProps = InferComponentProps<"div"> & {
    "data-state": "open" | "closed";
};

export const Backdrop = forwardRef<HTMLDivElement, BackdropProps>((props, ref) => {
    const { className } = props;

    return (
        <div
            {...props}
            ref={ref}
            className={cn(
                oneLine`
                    z-backdrop
                    data-[state=open]:animate-in
                    data-[state=closed]:animate-out
                    data-[state=closed]:fade-out
                    data-[state=open]:fade-in
                    fixed
                    inset-0
                    bg-black/60
                    blur-lg
                    transition
                    ease-in
                    data-[state=closed]:duration-100
                    data-[state=open]:duration-200
                `,
                className,
            )}
        />
    );
});

Backdrop.displayName = "Backdrop";
