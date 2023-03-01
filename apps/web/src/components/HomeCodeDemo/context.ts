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

export interface HomeCodeDemoSelections {
    jane: keyof HomeCodeDemoPositions | null;
    john: keyof HomeCodeDemoPositions | null;
}

export interface HomeCodeDemoContextValue {
    codePositions: HomeCodeDemoPositions;
    initPositions: HomeCodeDemoPositions;
    selections: HomeCodeDemoSelections;
    setCodePositions: Dispatch<SetStateAction<HomeCodeDemoPositions>>;
    setInitPositions: Dispatch<SetStateAction<HomeCodeDemoPositions>>;
    setSelections: Dispatch<SetStateAction<HomeCodeDemoSelections>>;
}

export const HomeCodeDemoContext = createContext<HomeCodeDemoContextValue>({
    codePositions: INITIAL_POSITIONS,
    initPositions: INITIAL_POSITIONS,
    selections: { jane: null, john: null },
    setCodePositions: () => undefined,
    setInitPositions: () => undefined,
    setSelections: () => undefined,
});
