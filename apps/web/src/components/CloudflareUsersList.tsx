import clsx from "clsx";
import { CSSProperties, FC } from "react";
import { usePluvMyself, usePluvOthers } from "../pluv-io/cloudflare";

export interface CloudflareUsersListProps {
    className?: string;
    style?: CSSProperties;
}

export const CloudflareUsersList: FC<CloudflareUsersListProps> = ({
    className,
    style,
}) => {
    const myName = usePluvMyself((myself) => myself.user.name);

    const names = usePluvOthers((others) => {
        return others.map((other) => other.user.name);
    });

    return (
        <div
            className={clsx(
                className,
                "flex flex-col items-stretch",
                "border border-gray-600 p-2"
            )}
            style={style}
        >
            <div className={clsx("border-b border-gray-600")}>Users</div>
            <div className={clsx("flex flex-col items-stretch")}>
                {!!myName && <div>{myName}</div>}
                {names.map((name, i) => (
                    <div key={i}>{name}</div>
                ))}
            </div>
        </div>
    );
};
