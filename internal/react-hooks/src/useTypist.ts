import { useIntersectionObserver, useUpdateEffect } from "@react-hookz/web";
import ms from "ms";
import { RefObject, useRef } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowFocus } from "./useWindowFocus";

export type TypistMode = "starting" | "typing" | "deleting" | "paused" | "halted";

export interface TypistState {
    completed: boolean;
    text: string;
}

export interface UseTypistParams {
    deleteDelay?: number;
    deleteSpeed?: number;
    onChange?: (state: TypistState) => void;
    paused?: boolean;
    repeat?: boolean;
    repeatDelay?: number;
    sentences: readonly string[];
    typingDelay?: number;
    typingSpeed?: number;
}

export interface UseTypistActions {
    reset: () => void;
}

export type UseTypistResult = readonly [TypistState, UseTypistActions];

export const useTypist = <TElement extends HTMLElement>(
    ref: RefObject<TElement>,
    params: UseTypistParams,
): UseTypistResult => {
    const {
        deleteDelay = ms("2s"),
        onChange,
        paused,
        repeat = true,
        sentences,
        typingDelay = ms("1s"),
        typingSpeed = ms("75ms"),
        deleteSpeed = typingSpeed,
        repeatDelay = typingDelay,
    } = params;

    const focused = useWindowFocus();
    const intersection = useIntersectionObserver(ref, {
        threshold: [0],
    });

    const [index, setIndex] = useState<number>(0);
    const [displayedSentence, setDisplayedSentence] = useState<string>("");
    const [mode, setMode] = useState<TypistMode>("starting");

    const sentence: string = sentences[index] ?? "";
    const isCompleted: boolean = sentence === displayedSentence;
    const isIntersecting: boolean = !!intersection?.isIntersecting;
    const hasDisplayedSentence: boolean = !!displayedSentence;
    const sentencesCount: number = sentences.length;

    const timeoutsRef = useRef<[timeout1: number | null, timeout2: number | null, timeout3: number | null]>([
        null,
        null,
        null,
    ]);
    const intervalsRef = useRef<[interval1: number | null, interval2: number | null]>([null, null]);

    const isViewed = focused && isIntersecting;

    const reset = useCallback(() => {
        intervalsRef.current.forEach((interval) => {
            interval && clearInterval(interval);
        });
        timeoutsRef.current.forEach((timeout) => {
            timeout && clearTimeout(timeout);
        });

        setIndex(0);
        setDisplayedSentence("");
        setMode("starting");
    }, []);

    useEffect(() => {
        if (mode !== "starting") return;
        if (!isViewed) return;

        const timeout: number = setTimeout(() => {
            setMode("typing");
        }, typingDelay) as any;

        timeoutsRef.current[0] = timeout;

        return () => {
            clearTimeout(timeout);
        };
    }, [isViewed, mode, typingDelay]);

    useEffect(() => {
        if (paused) return;
        if (isViewed) {
            reset();

            return;
        }

        reset();
        setMode("halted");
    }, [isViewed, paused, reset]);

    useEffect(() => {
        if (paused) return;
        if (!sentence) return;
        if (mode !== "typing") return;

        const interval: number = setInterval(() => {
            setDisplayedSentence((oldSentence) => {
                const oldLength = oldSentence.length;

                if (oldLength >= sentence.length) {
                    clearInterval(interval);

                    return oldSentence;
                }

                return `${oldSentence}${sentence.charAt(oldLength)}`;
            });
        }, typingSpeed) as any;

        intervalsRef.current[0] = interval;

        return () => {
            clearInterval(interval);
        };
    }, [mode, paused, sentence, typingSpeed]);

    useEffect(() => {
        if (paused) return;
        if (!sentence) return;
        if (mode !== "deleting") return;

        if (!deleteSpeed) {
            setDisplayedSentence("");

            return;
        }

        const interval: number = setInterval(() => {
            setDisplayedSentence((oldSentence) => {
                const oldLength = oldSentence.length;

                if (!oldLength) {
                    clearInterval(interval);

                    return "";
                }

                return oldSentence.slice(0, oldLength - 1);
            });
        }, deleteSpeed) as any;

        intervalsRef.current[1] = interval;

        return () => {
            clearInterval(interval);
        };
    }, [deleteSpeed, mode, paused, sentence]);

    useEffect(() => {
        if (paused) return;
        if (mode !== "typing") return;
        if (!isCompleted) return;

        setMode("paused");
    }, [isCompleted, mode, paused]);

    useEffect(() => {
        if (paused) return;
        if (mode !== "paused") return;
        if (!Number.isFinite(deleteDelay)) return;

        const timeout: number = setTimeout(() => {
            setMode("deleting");
        }, deleteDelay) as any;

        timeoutsRef.current[1] = timeout;

        return () => {
            clearTimeout(timeout);
        };
    }, [deleteDelay, mode, paused]);

    useEffect(() => {
        if (paused) return;
        if (sentencesCount === 1) return;
        if (index >= sentencesCount - 1) return;
        if (mode !== "deleting") return;
        if (hasDisplayedSentence) return;

        setIndex((oldIndex) => (oldIndex >= sentencesCount - 1 ? 0 : oldIndex + 1));

        setMode("starting");
    }, [hasDisplayedSentence, index, mode, paused, sentencesCount]);

    useEffect(() => {
        if (paused) return;
        if (!repeat) return;
        if (index < sentencesCount - 1) return;
        if (mode !== "deleting") return;
        if (hasDisplayedSentence) return;

        const timeout: number = setTimeout(() => {
            setIndex(0);
            setMode("starting");
        }, repeatDelay) as any;

        timeoutsRef.current[2] = timeout;

        return () => {
            clearTimeout(timeout);
        };
    }, [hasDisplayedSentence, index, mode, paused, repeat, repeatDelay, sentencesCount]);

    const completed = isCompleted && index === sentencesCount - 1 && mode === "paused";

    const typistState = useMemo(
        () => ({ completed, mode, text: displayedSentence }),
        [completed, displayedSentence, mode],
    );

    useUpdateEffect(() => {
        onChange?.(typistState);
    }, [onChange, typistState]);

    return [typistState, { reset }];
};
