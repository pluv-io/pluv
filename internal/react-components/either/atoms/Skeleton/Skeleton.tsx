import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type SkeletonProps = InferComponentProps<"div">;

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>((props, ref) => {
    return <div {...props} className={cn("bg-muted animate-pulse rounded-md", props.className)} ref={ref} />;
});

Skeleton.displayName = "Skeleton";
