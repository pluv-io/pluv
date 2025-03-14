import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type SideBarProps = ComponentProps<"aside">;

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
                    border-border
                `,
                className,
            )}
        />
    );
});

SideBar.displayName = "SideBar";
