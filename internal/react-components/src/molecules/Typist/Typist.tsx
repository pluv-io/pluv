import type { UseTypistParams } from "@pluv-internal/react-hooks";
import { useTypist } from "@pluv-internal/react-hooks";
import ms from "ms";
import type { CSSProperties, FC, ReactNode } from "react";
import { useRef } from "react";
import { TypistCursor } from "./TypistCursor";

export type { TypistMode, TypistState } from "@pluv-internal/react-hooks";

export type TypistProps = UseTypistParams & {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
};

const _Typist: FC<TypistProps> = ({
    children,
    className,
    deleteDelay,
    deleteSpeed,
    onChange,
    paused,
    repeat,
    repeatDelay,
    sentences,
    style,
    typingDelay,
    typingSpeed,
}) => {
    const rootRef = useRef<HTMLSpanElement>(null);

    const [{ text }] = useTypist(rootRef, {
        deleteDelay,
        deleteSpeed,
        onChange,
        paused,
        repeat,
        repeatDelay,
        sentences,
        typingDelay,
        typingSpeed,
    });

    return (
        <span ref={rootRef} className={className} style={style}>
            <span>{text}</span>
            {children}
        </span>
    );
};

_Typist.displayName = "Typist";

export const Typist = Object.assign(_Typist, {
    Cursor: TypistCursor,
});
