import type {
    BaseUser,
    GetInitialStorageFn,
    IORoomListenerEvent,
    IOUserConnectedEvent,
    IOUserDisconnectedEvent,
} from "@pluv/io";
import type { InputZodLike } from "@pluv/types";
import type { PluvPlatform } from "./PluvPlatform";

export interface PluvIOEndpoints {
    createToken: string;
}

export type PluvIOListeners<TContext extends Record<string, any> = {}, TUser extends BaseUser = BaseUser> = {
    getInitialStorage?: GetInitialStorageFn<TContext>;
    onRoomDeleted: (event: IORoomListenerEvent<TContext>) => void;
    onUserConnected: (
        event: IOUserConnectedEvent<PluvPlatform<TContext>, { user: InputZodLike<TUser> }, TContext>,
    ) => void;
    onUserDisconnected: (
        event: IOUserDisconnectedEvent<PluvPlatform<TContext>, { user: InputZodLike<TUser> }, TContext>,
    ) => void;
};
