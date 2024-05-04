import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type AppBarProps = InferComponentProps<"div">;

export const AppBar = forwardRef<HTMLDivElement, AppBarProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <div
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    z-app-bar
                    sticky
                    top-0
                    min-h-[4rem]
                    w-full
                    border-b
                    border-solid
                    border-indigo-700/60
                    bg-zinc-800
                    px-4
                    py-2
                    shadow-lg
                    shadow-indigo-800
                `,
                className,
            )}
        />
    );
});

AppBar.displayName = "AppBar";
