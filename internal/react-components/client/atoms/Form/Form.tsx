import { InferComponentProps } from "@pluv-internal/typings";
import { Slot } from "@radix-ui/react-slot";
import { ForwardedRef, forwardRef } from "react";
import { FieldValues, FormProvider, FormProviderProps } from "react-hook-form";
import { FormContext } from "./FormContext";

export type FormProps<
    TFieldValues extends FieldValues,
    TContext = any,
    TTransformedValues extends FieldValues = TFieldValues,
> = InferComponentProps<"form"> & {
    asChild?: boolean;
    disabled?: boolean;
    form: Omit<FormProviderProps<TFieldValues, TContext, TTransformedValues>, "children">;
    ref?: ForwardedRef<HTMLFormElement>;
};

export const Form = forwardRef<HTMLFormElement, FormProps<any>>((props, ref) => {
    const { asChild, disabled = false, form, ...restProps } = props;

    const Component = asChild ? Slot : "form";

    return (
        <FormProvider {...form}>
            <FormContext.Provider value={{ disabled }}>
                <Component {...restProps} ref={ref} />
            </FormContext.Provider>
        </FormProvider>
    );
}) as (<TFieldValues extends FieldValues, TContext = any, TTransformedValues extends FieldValues = TFieldValues>(
    props: FormProps<TFieldValues, TContext, TTransformedValues>,
) => JSX.Element) & { displayName?: string };

Form.displayName = "Form";
