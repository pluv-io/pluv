import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type AvatarCountProps = InferComponentProps<"div"> & {
    count: number;
};

export const AvatarCount = forwardRef<HTMLDivElement, AvatarCountProps>((props, ref) => {
    const { className, count, ...restProps } = props;

    return (
        <div
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    relative
                    flex
                    size-10
                    shrink-0
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    border
                    border-muted-foreground
                    bg-black
                    text-sm
                    font-semibold
                    text-white
                `,
                className,
            )}
        >
            +{count.toLocaleString()}
        </div>
    );
});

AvatarCount.displayName = "AvatarCount";
