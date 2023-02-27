import type { Dispatch, SetStateAction } from "react";
import { createContext } from "react";

const INITIAL_POSITIONS: HomeCodeDemoPositions = {
    first: { x: -48, y: 0 },
    second: { x: 48, y: 0 },
};

export interface HomeCodeDemoPosition {
    x: number;
    y: number;
}

export interface HomeCodeDemoPositions {
    first: HomeCodeDemoPosition;
    second: HomeCodeDemoPosition;
}

export interface HomeCodeDemoContextValue {
    codePositions: HomeCodeDemoPositions;
    initPositions: HomeCodeDemoPositions;
    setCodePositions: Dispatch<SetStateAction<HomeCodeDemoPositions>>;
    setInitPositions: Dispatch<SetStateAction<HomeCodeDemoPositions>>;
}

export const HomeCodeDemoContext = createContext<HomeCodeDemoContextValue>({
    codePositions: INITIAL_POSITIONS,
    initPositions: INITIAL_POSITIONS,
    setCodePositions: () => undefined,
    setInitPositions: () => undefined,
});
