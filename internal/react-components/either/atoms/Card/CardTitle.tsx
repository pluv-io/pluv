import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type CardTitleProps = ComponentProps<"h1" | "h2" | "h3" | "h4" | "h5" | "h6"> & {
    heading?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, heading: Heading = "h3", ...props }, ref) => {
        return <Heading ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
    },
);

CardTitle.displayName = "CardTitle";
