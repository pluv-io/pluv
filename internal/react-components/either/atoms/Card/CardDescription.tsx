import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type CardDescriptionProps = ComponentProps<"p">;

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
    ({ className, ...props }, ref) => {
        return <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />;
    },
);

CardDescription.displayName = "CardDescription";
