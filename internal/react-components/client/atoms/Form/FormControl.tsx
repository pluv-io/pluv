import { InferComponentProps } from "@pluv-internal/typings";
import { Slot } from "@radix-ui/react-slot";
import { ElementRef, forwardRef } from "react";
import { useFormField } from "./useFormField";
import { useFormContext } from "./useFormContext";

export type FormControlProps = InferComponentProps<typeof Slot> & {
    disabled?: boolean;
};

export const FormControl = forwardRef<ElementRef<typeof Slot>, FormControlProps>(({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    const { disabled } = useFormContext();

    return (
        <Slot
            ref={ref}
            id={formItemId}
            disabled={disabled}
            aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
            aria-disabled={disabled}
            aria-invalid={!!error}
            {...props}
        />
    );
});
FormControl.displayName = "FormControl";
