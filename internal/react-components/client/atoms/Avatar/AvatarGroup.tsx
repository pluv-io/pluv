import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type AvatarGroupProps = InferComponentProps<"div">;

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <div
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    inline-flex
                    items-center
                    [&>*:nth-child(n+2)]:-ml-2.5
                `,
                className,
            )}
        />
    );
});

AvatarGroup.displayName = "AvatarGroup";
