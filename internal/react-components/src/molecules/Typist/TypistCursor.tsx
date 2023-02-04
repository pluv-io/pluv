import { clsx } from "clsx";
import { CSSProperties, FC } from "react";

export interface TypistCursorProps {
    className?: string;
    style?: CSSProperties;
}

export const TypistCursor: FC<TypistCursorProps> = ({ className, style }) => {
    return (
        <span
            className={clsx(
                className,
                "animate-[blink_1s_linear_infinite]",
                "text-[0.84em] font-medium opacity-100"
            )}
            style={style}
        />
    );
};
