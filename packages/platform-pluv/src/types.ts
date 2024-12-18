import type { GetInitialStorageFn } from "@pluv/io";

export interface PluvIOEndpoints {
    createToken: string;
}

export type RoomDeletedMessageEventData = {
    encodedState: string | null;
    room: string;
};

export type UserConnectedEventData = {
    encodedState: string | null;
    room: string;
    user: any;
};

export type UserDisconnectedEventData = {
    encodedState: string | null;
    room: string;
    user: any;
};

export type PluvIOListeners = {
    getInitialStorage?: GetInitialStorageFn<{}>;
    onRoomDeleted: (event: RoomDeletedMessageEventData) => void;
    onUserConnected: (event: UserConnectedEventData) => void;
    onUserDisconnected: (event: UserDisconnectedEventData) => void;
};
