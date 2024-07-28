import { createContext } from "react";
import { getShiki } from "../../utils/getShiki";

export type CodeBlockContextValue = Awaited<ReturnType<typeof getShiki>> | null;

export const CodeBlockContext = createContext<CodeBlockContextValue>(null);
