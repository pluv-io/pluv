import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import * as RadixLabel from "@radix-ui/react-label";
import { ElementRef, forwardRef } from "react";
import { Label } from "../Label";
import { useFormField } from "./useFormField";

export type FormLabelProps = ComponentProps<typeof RadixLabel.Root>;

export const FormLabel = forwardRef<ElementRef<typeof RadixLabel.Root>, FormLabelProps>(
    ({ className, ...props }, ref) => {
        const { error, formItemId } = useFormField();

        return (
            <Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props} />
        );
    },
);
FormLabel.displayName = "FormLabel";
