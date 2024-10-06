import type { JsonObject } from "@pluv/types";
import type { AuthEndpoint, WsEndpoint } from "./PluvRoom";

export interface RegisterParams<TMetadata extends JsonObject> {
    authEndpoint: AuthEndpoint<TMetadata>;
    publicKey: string;
}

export const register = <TMetadata extends JsonObject>(params: RegisterParams<TMetadata>) => {
    const { authEndpoint, publicKey } = params;

    const wsEndpoint: WsEndpoint<TMetadata> = ({ room }) => `wss://connect.pluv.io/api/room?room=${room}`;

    return {
        authEndpoint,
        publicKey,
        wsEndpoint,
    };
};
