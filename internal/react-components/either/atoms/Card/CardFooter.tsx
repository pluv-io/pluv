import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type CardFooterProps = ComponentProps<"div">;

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />;
});

CardFooter.displayName = "CardFooter";
