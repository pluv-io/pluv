import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type SideBarProps = InferComponentProps<"aside">;

export const SideBar = forwardRef<HTMLElement, SideBarProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <aside
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    sticky
                    inset-y-0
                    left-0
                    max-h-screen
                    w-72
                    max-w-[90vw]
                    border-r
                    border-solid
                    border-indigo-700/60
                `,
                className,
            )}
        />
    );
});

SideBar.displayName = "SideBar";
