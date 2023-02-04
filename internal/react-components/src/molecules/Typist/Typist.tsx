import {
    useIntersectionObserver,
    useUpdateEffect,
    useWindowFocus,
} from "@pluv-internal/react-hooks";
import ms from "ms";
import {
    CSSProperties,
    FC,
    ReactNode,
    useEffect,
    useRef,
    useState,
} from "react";
import { TypistCursor } from "./TypistCursor";

export type TypistMode = "typing" | "deleting" | "paused" | "halted";

export interface TypistState {
    completed: boolean;
    mode: TypistMode;
    text: string;
}

export interface TypistProps {
    children?: ReactNode;
    className?: string;
    deleteDelay?: number;
    deleteSpeed?: number;
    onChange?: (state: TypistState) => void;
    repeat?: boolean;
    repeatDelay?: number;
    sentences: readonly string[];
    style?: CSSProperties;
    typingDelay?: number;
    typingSpeed?: number;
}

const _Typist: FC<TypistProps> = ({
    children,
    className,
    deleteDelay = ms("2s"),
    onChange,
    repeat = true,
    sentences,
    style,
    typingDelay = ms("1s"),
    typingSpeed = ms("75ms"),
    deleteSpeed = typingSpeed,
    repeatDelay = typingDelay,
}) => {
    const rootRef = useRef<HTMLSpanElement>(null);

    const focused = useWindowFocus();
    const intersection = useIntersectionObserver(rootRef, {
        threshold: [0],
    });

    const [mode, setMode] = useState<TypistMode>("typing");
    const [index, setIndex] = useState<number>(0);
    const [displayedSentence, setDisplayedSentence] = useState<string>("");

    const sentence: string = sentences[index] ?? "";
    const isCompleted: boolean = sentence === displayedSentence;
    const isIntersecting: boolean = !!intersection?.isIntersecting;

    useEffect(() => {
        if (focused && isIntersecting) {
            setMode("typing");

            return;
        }

        setIndex(0);
        setMode("halted");
        setDisplayedSentence("");
    }, [focused, isIntersecting]);

    useEffect(() => {
        if (!sentence) return;
        if (mode !== "typing") return;

        const interval = setInterval(() => {
            setDisplayedSentence((oldSentence) => {
                const oldLength = oldSentence.length;

                if (oldLength >= sentence.length) {
                    clearInterval(interval);

                    return oldSentence;
                }

                return `${oldSentence}${sentence.charAt(oldLength)}`;
            });
        }, typingSpeed);

        return () => {
            clearInterval(interval);
        };
    }, [mode, sentence, typingSpeed]);

    useEffect(() => {
        if (!sentence) return;
        if (mode !== "deleting") return;

        const interval = setInterval(() => {
            setDisplayedSentence((oldSentence) => {
                const oldLength = oldSentence.length;

                if (!oldLength) {
                    clearInterval(interval);

                    return "";
                }

                return oldSentence.slice(0, oldLength - 1);
            });
        }, deleteSpeed);
    }, [deleteSpeed, mode, sentence]);

    useEffect(() => {
        if (mode !== "typing") return;
        if (!isCompleted) return;

        setMode("paused");
    }, [isCompleted, mode]);

    useEffect(() => {
        if (mode !== "paused") return;

        const timeout = setTimeout(() => {
            setMode("deleting");
        }, deleteDelay);

        return () => {
            clearTimeout(timeout);
        };
    }, [deleteDelay, mode]);

    useEffect(() => {
        if (index >= sentences.length - 1) return;
        if (mode !== "deleting") return;
        if (displayedSentence) return;

        const timeout = setTimeout(() => {
            setIndex((oldIndex) =>
                oldIndex >= sentences.length - 1 ? 0 : oldIndex + 1
            );
            setMode("typing");
        }, typingDelay);

        return () => {
            clearTimeout(timeout);
        };
    }, [displayedSentence, index, mode, sentences, typingDelay]);

    useEffect(() => {
        if (!repeat) return;
        if (index < sentences.length - 1) return;
        if (mode !== "deleting") return;
        if (displayedSentence) return;

        const timeout = setTimeout(() => {
            setIndex(0);
            setMode("typing");
        }, repeatDelay);

        return () => {
            clearTimeout(timeout);
        };
    }, [displayedSentence, index, mode, repeat, repeatDelay, sentences]);

    const completed =
        isCompleted && index === sentences.length - 1 && mode === "paused";

    useUpdateEffect(() => {
        onChange?.({ completed, mode, text: displayedSentence });
    }, [completed, displayedSentence, mode, onChange]);

    return (
        <span ref={rootRef} className={className} style={style}>
            <span>{displayedSentence}</span>
            {children}
        </span>
    );
};

_Typist.displayName = "Typist";

export const Typist = Object.assign(_Typist, {
    Cursor: TypistCursor,
});
