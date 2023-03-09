import { TypistState } from "@pluv-internal/react-hooks";
import { createContext } from "react";

export type HomeTypeSafetyDemoContextValue = readonly TypistState[];

export const HomeTypeSafetyDemoContext =
    createContext<HomeTypeSafetyDemoContextValue>([]);
