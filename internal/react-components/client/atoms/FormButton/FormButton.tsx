import { forwardRef } from "react";
import { Button, type ButtonProps } from "../../../either/atoms/Button";
import { Form } from "../Form";

export type FormButtonProps = ButtonProps;

export const FormButton = forwardRef<HTMLButtonElement, FormButtonProps>((props, ref) => {
    const { disabled } = Form.useContext();

    return <Button {...props} ref={ref} disabled={disabled || props.disabled} />;
});

FormButton.displayName = "FormButton";
