export const ConnectionState = {
    Closed: "closed",
    Connecting: "connecting",
    Open: "open",
    Unavailable: "unavailable",
    Untouched: "untouched",
} as const;

export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];

export const StorageState = {
    Loading: "loading",
    Offline: "offline",
    Synced: "synced",
    Unavailable: "unavailable",
};

export type StorageState = (typeof StorageState)[keyof typeof StorageState];
