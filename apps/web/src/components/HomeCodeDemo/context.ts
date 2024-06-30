import type { Dispatch, SetStateAction } from "react";
import { createContext } from "react";
import { BOX_SIZE } from "./constants";

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
    "User 1": keyof HomeCodeDemoPositions | null;
    "User 2": keyof HomeCodeDemoPositions | null;
}

export interface HomeCodeDemoContextValue {
    boxSize: number;
    codePositions: HomeCodeDemoPositions;
    initPositions: HomeCodeDemoPositions;
    selections: HomeCodeDemoSelections;
    setCodePositions: Dispatch<SetStateAction<HomeCodeDemoPositions>>;
    setInitPositions: Dispatch<SetStateAction<HomeCodeDemoPositions>>;
    setSelections: Dispatch<SetStateAction<HomeCodeDemoSelections>>;
}

export const HomeCodeDemoContext = createContext<HomeCodeDemoContextValue>({
    boxSize: BOX_SIZE,
    codePositions: INITIAL_POSITIONS,
    initPositions: INITIAL_POSITIONS,
    selections: { "User 1": null, "User 2": null },
    setCodePositions: () => undefined,
    setInitPositions: () => undefined,
    setSelections: () => undefined,
});
