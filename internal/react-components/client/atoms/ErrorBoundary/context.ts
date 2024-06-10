import { createContext } from "react";

export interface ErrorBoundaryContextProps {
    reset?: () => void;
}

export const ErrorBoundaryContext = createContext<ErrorBoundaryContextProps>({});
