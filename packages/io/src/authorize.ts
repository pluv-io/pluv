import hkdf from "@panva/hkdf";
import type { BaseUser } from "@pluv/types";
import { EncryptJWT, jwtDecrypt } from "jose";
import type { AbstractPlatform, InferPlatformRoomContextType } from "./AbstractPlatform";

const DEFAULT_MAX_AGE_MS = 60_000;

export const getEncryptionKey = async (secret: string): Promise<Uint8Array> => {
    return await hkdf("sha256", secret, "", "Pluv.io Generated Encryption Key", 32);
};

export interface JWT<TUser extends BaseUser> {
    room: string;
    sub: string;
    user: TUser;
}

export type JWTEncodeParams<TUser extends BaseUser, TPlatform extends AbstractPlatform> = {
    maxAge?: number;
    room: string;
    user: TUser;
} & InferPlatformRoomContextType<TPlatform>;

export interface AuthorizeParams {
    platform: AbstractPlatform;
    secret: string;
}

export interface AuthorizeModule {
    decode: <TUser extends BaseUser>(jwt: string) => Promise<TUser | null>;
    encode: <TUser extends BaseUser, TPlatform extends AbstractPlatform>(
        params: JWTEncodeParams<TUser, TPlatform>,
    ) => Promise<string>;
}

const now = () => (Date.now() / 1_000) | 0;

export const authorize = (params: AuthorizeParams) => {
    const { platform, secret } = params;

    const encode = async <TUser extends BaseUser, TPlatform extends AbstractPlatform>(
        encodeParams: JWTEncodeParams<TUser, TPlatform>,
    ): Promise<string> => {
        const { maxAge = DEFAULT_MAX_AGE_MS, room, user } = encodeParams;

        const encryptionSecret = await getEncryptionKey(secret);

        const token = await new EncryptJWT({
            room,
            sub: room ? `${room}|${user.id}` : user.id,
            user,
        })
            .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
            .setIssuedAt()
            .setExpirationTime(now() + maxAge)
            .setJti(platform.randomUUID())
            .encrypt(encryptionSecret);

        return token.toString();
    };

    const decode = async <TUser extends BaseUser>(jwt: string): Promise<JWT<TUser> | null> => {
        const encryptionSecret = await getEncryptionKey(secret);

        const { payload } = await jwtDecrypt(jwt, encryptionSecret, {
            clockTolerance: 15,
        });

        return (payload as any) ?? null;
    };

    return { decode, encode };
};
