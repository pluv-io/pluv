import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type BannerProps = ComponentProps<"div">;

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
                    border-primary
                    bg-primary
                    px-4
                    py-2
                    text-center
                    text-sm
                    text-primary-foreground
                `,
                className,
            )}
        />
    );
});

Banner.displayName = "Banner";
