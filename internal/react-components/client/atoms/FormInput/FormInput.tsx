import { forwardRef } from "react";
import { Input, InputProps } from "../../../either/atoms/Input";
import { Form } from "../Form";

export type FormInputProps = InputProps;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
    const { disabled } = Form.useContext();

    return <Input {...props} ref={ref} disabled={disabled || props.disabled} />;
});

FormInput.displayName = "FormInput";
