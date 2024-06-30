import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

export type PageContainerProps = InferComponentProps<"div"> & {
    asChild?: boolean;
};

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>((props, ref) => {
    const { asChild, className, ...restProps } = props;

    const Component = asChild ? Slot : "div";

    return <Component {...restProps} className={cn("px-2 py-0 sm:px-4", className)} ref={ref} />;
});

PageContainer.displayName = "PageContainer";
