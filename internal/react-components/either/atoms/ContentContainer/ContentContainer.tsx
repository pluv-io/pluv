import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type ContentContainerProps = InferComponentProps<"div">;

export const ContentContainer = forwardRef<HTMLDivElement, ContentContainerProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <div
            {...restProps}
            className={cn(
                oneLine`
                    mx-auto
                    w-[calc(1200px+(2*16px))]
                    max-w-full
                    px-[16px]
                    py-0
                    sm:w-[calc(1200px+(2*24px))]
                    sm:px-[24px]
                `,
                className,
            )}
            ref={ref}
        />
    );
});

ContentContainer.displayName = "ContentContainer";
