import type {
    BaseUser,
    GetInitialStorageFn,
    IOUserConnectedEvent,
    IOUserDisconnectedEvent,
} from "@pluv/io";
import type { InputZodLike } from "@pluv/types";
import type { z } from "zod";
import type { PluvPlatform } from "./PluvPlatform";
import type {
    ZodEventKind,
    ZodEventResponse,
    ZodInitialStorageResponse,
    ZodRoomDeletedResponse,
    ZodUserConnectedResponse,
    ZodUserDisconnectedResponse,
} from "./schemas";

export interface PluvIOEndpoints {
    createToken: string;
}

export type IORoomListenerEvent<TContext extends Record<string, any>> = {
    context: TContext;
    encodedState: string | null;
    room: string;
};

export type PluvIOListeners<
    TContext extends Record<string, any> = {},
    TUser extends BaseUser = BaseUser,
> = {
    getInitialStorage?: GetInitialStorageFn<TContext>;
    onRoomDeleted: (event: IORoomListenerEvent<TContext>) => void;
    onUserConnected: (
        event: IOUserConnectedEvent<
            PluvPlatform<TContext>,
            { user: InputZodLike<TUser> },
            TContext
        >,
    ) => void;
    onUserDisconnected: (
        event: IOUserDisconnectedEvent<
            PluvPlatform<TContext>,
            { user: InputZodLike<TUser> },
            TContext
        >,
    ) => void;
};

export type EventKind = z.output<typeof ZodEventKind>;

export type InitialStorageResponse = z.output<typeof ZodInitialStorageResponse>;
export type RoomDeletedResponse = z.output<typeof ZodRoomDeletedResponse>;
export type UserConnectedResponse = z.output<typeof ZodUserConnectedResponse>;
export type UserDisconnectedResponse = z.output<typeof ZodUserDisconnectedResponse>;

export type EventResponse = z.output<typeof ZodEventResponse>;
