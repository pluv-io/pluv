import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type PageContainerProps = InferComponentProps<"div">;

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <div {...restProps} className={cn("px-2 py-0 sm:px-4", className)} ref={ref} />;
});

PageContainer.displayName = "PageContainer";
