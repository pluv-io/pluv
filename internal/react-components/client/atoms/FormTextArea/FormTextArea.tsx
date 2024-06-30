import { forwardRef } from "react";
import { TextArea, TextAreaProps } from "../../../either/atoms/TextArea";
import { Form } from "../Form";

export type FormTextAreaProps = TextAreaProps;

export const FormTextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>((props, ref) => {
    const { disabled } = Form.useContext();

    return <TextArea {...props} ref={ref} disabled={disabled || props.disabled} />;
});

FormTextArea.displayName = "FormTextArea";
