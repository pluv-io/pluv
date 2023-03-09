import ms from "ms";
import { RefObject, useEffect, useMemo } from "react";
import { TypistState, useTypist, UseTypistParams } from "./useTypist";

export interface OrchestratedTypistState {
    completed: boolean;
}

export type UseOrchestratedTypistParams = Pick<
    UseTypistParams,
    | "deleteDelay"
    | "deleteSpeed"
    | "paused"
    | "repeat"
    | "repeatDelay"
    | "sentences"
    | "typingDelay"
    | "typingSpeed"
> & {
    onChange?: (state: OrchestratedTypistState) => void;
};

export const useOrchestratedTypist = <TElement extends HTMLElement>(
    ref: RefObject<TElement>,
    params: UseOrchestratedTypistParams
): readonly TypistState[] => {
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
            const delay =
                prevSentence.length * typingSpeed + prevDelay + typingDelay;

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

    useEffect(() => {
        if (!isCompleted) return;
        if (!repeat) return;

        const timeout = setTimeout(() => {
            results.forEach(([, { reset }]) => reset());
        }, deleteDelay);

        return () => {
            clearTimeout(timeout);
        };
    }, [deleteDelay, isCompleted, repeat, results]);

    return results.map(([state]) => state);
};
