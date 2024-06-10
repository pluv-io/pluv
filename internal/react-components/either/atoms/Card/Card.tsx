import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type CardProps = InferComponentProps<"div">;

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("bg-card text-card-foreground rounded-lg border shadow-sm", className)}
            {...props}
        />
    );
});

Card.displayName = "Card";
