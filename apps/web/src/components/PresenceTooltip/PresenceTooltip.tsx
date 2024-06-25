"use client";

import { AvatarAnimal } from "@pluv-internal/react-components/client";
import { getMaxContrast } from "@pluv-internal/utils";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { FC } from "react";
import { useContext, useMemo } from "react";
import { useConnection, useOthers } from "../../pluv-io/cloudflare";
import { PresenceTooltipContext } from "./PresenceTooltipContext";
import { PresenceTooltipProviderContext } from "./PresenceTooltipProviderContext";

const hexToNumber = (hex: string): number => {
    return parseInt(hex.replace("#", ""), 16);
};

const calculateDegree = (color1: string, color2: string): number => {
    const num1 = hexToNumber(color1);
    const num2 = hexToNumber(color2);
    return (num1 + num2) % 360;
};

const createLinearGradient = (color1: string, color2: string): string => {
    const degree = calculateDegree(color1, color2);
    return `linear-gradient(${degree}deg, ${color1}, ${color2})`;
};

export type PresenceTooltipProps = RadixTooltip.TooltipProps & {
    selected?: boolean;
    selectionId: string;
};

export const PresenceTooltip: FC<PresenceTooltipProps> = (props) => {
    const { selected: _selected, selectionId, ...restProps } = props;

    const { selectedId, selections, setSelectedId } = useContext(PresenceTooltipProviderContext);
    const controlled = typeof _selected === "boolean";
    const selected = _selected ?? selectedId === selectionId;

    const userConnectionId = useConnection((connection) => connection.id);
    const othersConnectionIds = useOthers((others) => {
        return others
            .filter(({ presence }) => presence.selectionId === selectionId)
            .map(({ connectionId }) => connectionId);
    });
    const connectionIds = useMemo(
        () => [...othersConnectionIds, ...(selected ? [userConnectionId] : [])],
        [othersConnectionIds, selected, userConnectionId],
    );
    const hasConnections = !!connectionIds.length;

    const count = selections[selectionId] ?? 0;

    const colors = useMemo(
        () => connectionIds.map((connectionId) => AvatarAnimal.getColor(connectionId)),
        [connectionIds],
    );

    const [minColor, maxColor] = useMemo(
        () => (colors.length ? getMaxContrast(colors) : ["transparent", "transparent"]),
        [colors],
    );

    const color = useMemo(() => {
        if (!hasConnections) return "transparent";

        return minColor === maxColor ? minColor : createLinearGradient(minColor, maxColor);
    }, [hasConnections, minColor, maxColor]);

    const state = useMemo(
        () => ({ color, controlled, count, selected, selectedId, selectionId, setSelectedId }),
        [color, controlled, count, selected, selectedId, selectionId, setSelectedId],
    );

    return (
        <PresenceTooltipContext.Provider value={state}>
            <RadixTooltip.Root {...restProps} />
        </PresenceTooltipContext.Provider>
    );
};
