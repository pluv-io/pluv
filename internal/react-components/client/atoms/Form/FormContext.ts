import { createContext } from "react";

export interface FormContextValue {
    disabled: boolean;
}

export const FormContext = createContext<FormContextValue>({
    disabled: false,
});
