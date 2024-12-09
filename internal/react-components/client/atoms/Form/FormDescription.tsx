import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";
import { useFormField } from "./useFormField";

export type FormDescriptionProps = ComponentProps<"p">;

export const FormDescription = forwardRef<HTMLParagraphElement, FormDescriptionProps>(
    ({ className, ...props }, ref) => {
        const { formDescriptionId } = useFormField();

        return (
            <p ref={ref} id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />
        );
    },
);
FormDescription.displayName = "FormDescription";
