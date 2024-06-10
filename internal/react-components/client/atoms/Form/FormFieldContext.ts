import { createContext } from "react";
import { FieldPath, FieldValues } from "react-hook-form";

type FormFieldContextValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
    name: TName;
};

export const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);
