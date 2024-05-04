import ms from "ms";
import { RefObject, useCallback, useEffect, useMemo } from "react";
import { TypistState, useTypist, UseTypistParams } from "./useTypist";

export interface OrchestratedTypistState {
    completed: boolean;
}

export type UseOrchestratedTypistParams = Pick<
    UseTypistParams,
    "deleteDelay" | "deleteSpeed" | "paused" | "repeat" | "repeatDelay" | "sentences" | "typingDelay" | "typingSpeed"
> & {
    onChange?: (state: OrchestratedTypistState) => void;
};

export interface UseOrchestratedTypistActions {
    reset: () => void;
}

export type UseOrchestratedTypistResult = readonly [
    state: readonly TypistState[],
    actions: UseOrchestratedTypistActions,
];

export const useOrchestratedTypist = <TElement extends HTMLElement>(
    ref: RefObject<TElement>,
    params: UseOrchestratedTypistParams,
): UseOrchestratedTypistResult => {
    const {
        deleteDelay = ms("2s"),
        deleteSpeed,
        paused,
        repeat = true,
        repeatDelay,
        sentences,
        typingDelay = ms("1s"),
        typingSpeed = ms("75ms"),
    } = params;

    const typingDelays = useMemo(() => {
        return sentences.reduce<number[]>((acc, _, i) => {
            const prevSentence = sentences[i - 1] ?? "";
            const prevDelay = acc[i - 1] ?? 0;
            const delay = prevSentence.length * typingSpeed + prevDelay + typingDelay;

            return [...acc, delay];
        }, []);
    }, [sentences, typingDelay, typingSpeed]);

    const results = sentences.map((sentence, i) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useTypist(ref, {
            deleteDelay: Infinity,
            deleteSpeed,
            paused,
            repeat,
            repeatDelay,
            sentences: [sentence],
            typingDelay: typingDelays[i],
            typingSpeed,
        });
    });

    const isCompleted = results.every(([{ completed }]) => completed);

    const reset = useCallback(() => {
        results.forEach(([, { reset }]) => reset());
    }, [results]);

    useEffect(() => {
        if (!isCompleted) return;
        if (!repeat) return;

        const timeout = setTimeout(() => {
            reset();
        }, deleteDelay);

        return () => {
            clearTimeout(timeout);
        };
    }, [deleteDelay, isCompleted, repeat, reset, results]);

    return [results.map(([state]) => state), { reset }];
};
