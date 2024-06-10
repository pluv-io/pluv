import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type CardDescriptionProps = InferComponentProps<"p">;

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
    ({ className, ...props }, ref) => {
        return <p ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props} />;
    },
);

CardDescription.displayName = "CardDescription";
