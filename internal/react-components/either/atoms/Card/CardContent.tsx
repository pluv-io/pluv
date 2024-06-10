import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type CardContentProps = InferComponentProps<"div">;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
});

CardContent.displayName = "CardContent";
