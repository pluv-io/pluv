import { DEFAULT_MAX_CONNECTIONS, PRESENCE_FANOUT_BUDGET } from "../constants";
import type { PluvIOLimits } from "../types";
import { oneLine } from "./oneLine";

export const resolveMaxConnections = (limits: Pick<PluvIOLimits, "maxConnections">): number => {
    const maxConnections = limits.maxConnections ?? DEFAULT_MAX_CONNECTIONS;

    if (!Number.isInteger(maxConnections) || maxConnections < 1) {
        throw new Error(
            `limits.maxConnections must be a positive integer. Received: ${String(limits.maxConnections)}.`,
        );
    }

    return maxConnections;
};

export const assertPresenceFanoutBudget = (limits: PluvIOLimits): void => {
    const maxConnections = resolveMaxConnections(limits);
    const slots = maxConnections * maxConnections;

    if (slots <= PRESENCE_FANOUT_BUDGET) return;
    if (limits.dangerouslyAllowHighPresenceFanout) return;

    throw new Error(oneLine`
        maxConnections (${maxConnections.toLocaleString()}) is too high.
        Set dangerouslyAllowHighPresenceFanout: true to allow this.
    `);
};
