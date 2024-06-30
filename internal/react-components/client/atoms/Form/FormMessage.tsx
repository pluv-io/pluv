import { InferComponentProps } from "@pluv-internal/typings";
import { forwardRef } from "react";
import { useFormField } from "./useFormField";
import { cn } from "@pluv-internal/utils";

export type FormMessageProps = InferComponentProps<"p">;

export const FormMessage = forwardRef<HTMLParagraphElement, FormMessageProps>(
    ({ className, children, ...props }, ref) => {
        const { error, formMessageId } = useFormField();
        const body = error ? String(error?.message) : children;

        if (!body) {
            return null;
        }

        return (
            <p
                ref={ref}
                id={formMessageId}
                className={cn("text-xs font-medium text-destructive", className)}
                {...props}
            >
                {body}
            </p>
        );
    },
);
FormMessage.displayName = "FormMessage";
