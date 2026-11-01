import { createContext, useContext, type ReactNode } from "react";
import type { PluvConfig } from "../schemas";

const ConfigContext = createContext<PluvConfig | null>(null);

export const ConfigProvider = ({ children, value }: { children: ReactNode; value: PluvConfig }) => {
    return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

/** Loaded `pluv.config.ts`, after flags. Throws outside the pluv command. */
export const useConfig = (): PluvConfig => {
    const config = useContext(ConfigContext);

    if (!config) throw new Error("useConfig must be called inside a pluv command.");

    return config;
};
