"use client";

import { AvatarAnimal } from "@pluv-internal/react-components/client";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { FC } from "react";
import { useContext, useMemo } from "react";
import { useConnection, useOthers } from "../../pluv-io/cloudflare";
import { PresenceTooltipContext } from "./PresenceTooltipContext";
import { PresenceTooltipProviderContext } from "./PresenceTooltipProviderContext";

export type PresenceTooltipProps = RadixTooltip.TooltipProps & {
    selectionId: string;
};

export const PresenceTooltip: FC<PresenceTooltipProps> = (props) => {
    const { selectionId, ...restProps } = props;

    const { selectedId, selections } = useContext(PresenceTooltipProviderContext);
    const selected = selectedId === selectionId;

    const userConnectionId = useConnection((connection) => connection.id);
    const connectionIds = useOthers((others) => {
        return others
            .filter(({ presence }) => presence.selectionId === selectionId)
            .map(({ connectionId }) => connectionId);
    });

    const count = selections[selectionId] ?? 0;

    const color = useMemo((): string | null => {
        if (selected) return AvatarAnimal.getColor(userConnectionId);

        const connectionId = connectionIds[0];

        return typeof connectionId === "string" ? AvatarAnimal.getColor(connectionId) : null;
    }, [connectionIds, selected, userConnectionId]);

    const state = useMemo(
        () => ({ color, count, selected, selectedId, selectionId }),
        [color, count, selected, selectedId, selectionId],
    );

    return (
        <PresenceTooltipContext.Provider value={state}>
            <RadixTooltip.Root {...restProps} />
        </PresenceTooltipContext.Provider>
    );
};
