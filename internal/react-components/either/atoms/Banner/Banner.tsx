import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type BannerProps = InferComponentProps<"div">;

export const Banner = forwardRef<HTMLDivElement, BannerProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <div
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    flex
                    w-full
                    flex-row
                    items-center
                    justify-center
                    border-b
                    border-solid
                    border-zinc-800
                    bg-indigo-700
                    px-4
                    py-2
                    text-center
                    text-sm
                    text-white
                `,
                className,
            )}
        />
    );
});

Banner.displayName = "Banner";
