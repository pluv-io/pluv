import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type CardContentProps = ComponentProps<"div">;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
});

CardContent.displayName = "CardContent";
