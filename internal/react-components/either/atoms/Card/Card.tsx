import { cn } from "@pluv-internal/utils";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

export type CardProps = ComponentProps<"div">;

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
            {...props}
        />
    );
});

Card.displayName = "Card";
