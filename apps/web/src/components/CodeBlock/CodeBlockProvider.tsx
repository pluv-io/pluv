import { useAsync, useMountEffect } from "@pluv-internal/react-hooks";
import { useState, type FC, type ReactNode } from "react";
import { getShiki } from "../../utils/getShiki";
import { CodeBlockContext } from "./context";

export interface CodeBlockProviderProps {
    children?: ReactNode;
}

export const CodeBlockProvider: FC<CodeBlockProviderProps> = ({ children }) => {
    const [shikiPromise] = useState(() => getShiki());
    const [{ result: shiki = null }, { execute }] = useAsync(async () => {
        return await shikiPromise;
    });

    useMountEffect(() => {
        execute();
    });

    return <CodeBlockContext.Provider value={shiki}>{children}</CodeBlockContext.Provider>;
};
