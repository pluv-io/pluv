import { useContext } from "react";
import { FieldValues, useFormContext as useHookFormContext } from "react-hook-form";
import { FormContext } from "./FormContext";

export const useFormContext = <
    TFieldValues extends FieldValues,
    TContext = any,
    TTransformedValues extends FieldValues = TFieldValues,
>() => {
    const form = useHookFormContext<TFieldValues, TContext, TTransformedValues>();

    const formCtx = useContext(FormContext);

    return { ...form, ...formCtx };
};
