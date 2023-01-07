import React, { CSSProperties, FC } from "react";
import clsx from "clsx";

export interface ChatMessageProps {
    className?: string;
    message: string;
    name: string;
    style?: CSSProperties;
}

export const ChatMessage: FC<ChatMessageProps> = ({
    className,
    message,
    name,
    style,
}) => {
    return (
        <div
            className={clsx(
                className,
                "flex flex-col items-stretch",
                "rounded-sm p-2"
            )}
            style={style}
        >
            <div className="text-xs text-gray-600">{name}</div>
            <div className="text-base">{message}</div>
        </div>
    );
};
