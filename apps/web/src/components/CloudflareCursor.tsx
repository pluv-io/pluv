import clsx from "clsx";
import { CSSProperties, FC } from "react";
import { usePluvOther } from "../pluv-io/cloudflare";

export interface CloudflareCursorProps {
    className?: string;
    connectionId: string;
    style?: CSSProperties;
}

export const CloudflareCursor: FC<CloudflareCursorProps> = ({
    className,
    connectionId,
    style,
}) => {
    const other = usePluvOther(connectionId);

    const cursor = other?.presence.cursor;

    if (!cursor) return null;

    return (
        <div
            className={clsx(
                className,
                "relative",
                "h-4 w-4 rounded-full border border-black",
                "bg-gray-600"
            )}
            style={{
                position: "fixed",
                top: cursor.y,
                left: cursor.x,
                ...style,
            }}
        >
            <div
                className={clsx(
                    "absolute bottom-0 right-0",
                    "translate-x-full translate-y-full"
                )}
            >
                {other.user.name}
            </div>
        </div>
    );
};
