import { AvatarAnimal } from "@pluv-internal/react-components/client";
import { getMaxContrast } from "@pluv-internal/utils";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { CSSProperties, FC, ReactNode } from "react";
import { memo, useMemo } from "react";
import { useOthers } from "../../pluv-io/cloudflare";

export interface PresenceTooltipTriggerProps {
    children?: ReactNode;
}

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

export const PresenceTooltipTrigger = memo<PresenceTooltipTriggerProps>(({ children }) => {
    const connectionIds = useOthers((others) => others.map(({ connectionId }) => connectionId));
    const hasConnections = !!connectionIds.length;

    const colors = useMemo(
        () => connectionIds.map((connectionId) => AvatarAnimal.getColor(connectionId)),
        [connectionIds],
    );

    const [minColor, maxColor] = useMemo(() => getMaxContrast(colors), [colors]);

    const ringColor = useMemo(() => {
        if (!hasConnections) return "transparent";

        return minColor === maxColor ? minColor : createLinearGradient(minColor, maxColor);
    }, [hasConnections, minColor, maxColor]);

    return (
        <RadixTooltip.Trigger asChild className="ring-4" style={{ "--tw-ring-color": ringColor } as CSSProperties}>
            {children}
        </RadixTooltip.Trigger>
    );
});

PresenceTooltipTrigger.displayName = "PresenceTooltipTrigger";
