import { Avatar } from "@pluv-internal/react-components/client";
import { cn } from "@pluv-internal/utils";
import type { FC } from "react";
import { useOthers } from "../../pluv-io/cloudflare";

const MAX_AVATARS_COUNT = 4;

export interface HomeDemoOthersProps {
    className?: string;
}

export const HomeDemoOthers: FC<HomeDemoOthersProps> = ({ className }) => {
    const connectionIds = useOthers((others) => others.map((other) => other.connectionId));

    const remaining = Math.max(connectionIds.length - MAX_AVATARS_COUNT, 0);

    if (!connectionIds.length) {
        return <div className={cn("text-sm text-muted-foreground", className)}>No other users online</div>;
    }

    return (
        <Avatar.Group className={className}>
            {connectionIds.slice(0, MAX_AVATARS_COUNT).map((connectionId) => (
                <Avatar key={connectionId} className="size-8">
                    <Avatar.Animal data={connectionId} height={32} width={32} />
                </Avatar>
            ))}
            {!!remaining && <Avatar.Count count={remaining} />}
        </Avatar.Group>
    );
};
