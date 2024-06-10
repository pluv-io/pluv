import { createContext } from "react";

type FormItemContextValue = {
    id: string;
};

export const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);
