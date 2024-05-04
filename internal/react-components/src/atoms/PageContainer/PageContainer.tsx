import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type PageContainerProps = InferComponentProps<"div">;

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <div {...restProps} ref={ref} className={cn("w-full px-2 sm:px-4", className)} />;
});

PageContainer.displayName = "PageContainer";
