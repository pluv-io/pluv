import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type SkeletonProps = ComponentProps<"div">;

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>((props, ref) => {
    return <div {...props} className={cn("animate-pulse rounded-md bg-muted", props.className)} ref={ref} />;
});

Skeleton.displayName = "Skeleton";
