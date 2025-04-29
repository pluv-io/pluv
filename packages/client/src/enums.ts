export const ConnectionState = {
    Closed: "Closed",
    Connecting: "Connecting",
    Open: "Open",
    Unavailable: "Unavailable",
    Untouched: "Untouched",
} as const;

export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];
