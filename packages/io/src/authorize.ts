import { hkdf } from "@panva/hkdf";
import type { BaseUser, OperatorUser, ParticipantKind } from "@pluv/types";
import { EncryptJWT, jwtDecrypt } from "jose";
import type { AbstractPlatform, InferInitContextType } from "./AbstractPlatform";
import { assertExhaustive } from "./utils/assertExhaustive";

/** Default token lifetime: 60 seconds (passed to jose as seconds). */
const DEFAULT_MAX_AGE_MS = 60_000;

export const getEncryptionKey = async (secret: string): Promise<Uint8Array> => {
    return await hkdf("sha256", secret, "", "Pluv.io Generated Encryption Key", 32);
};

export interface JWT<TUser extends BaseUser> {
    kind: ParticipantKind;
    operator: OperatorUser | null;
    room: string;
    sub: string;
    user: TUser;
}

type JWTEncodeBase<TPlatform extends AbstractPlatform<any, any>> = {
    /**
     * Token lifetime in milliseconds. Converted to whole seconds for JWT `exp`.
     * @default 60_000
     */
    maxAge?: number;
    room: string;
} & InferInitContextType<TPlatform>;

type OccupantTokenIdentity<TUser extends BaseUser> = {
    kind?: "user";
    user: TUser;
};

type OperatorTokenIdentity = {
    kind: "operator";
    operator: OperatorUser & { email: string };
};

type OperatorSessionIdentity = {
    kind: "operator";
    operator: OperatorUser;
};

type JwtTokenIdentity<TUser extends BaseUser> =
    | OccupantTokenIdentity<TUser>
    | (OperatorSessionIdentity & { user: TUser });

export type CreateUserTokenParams<
    TUser extends BaseUser,
    TPlatform extends AbstractPlatform<any, any>,
> = JWTEncodeBase<TPlatform> & OccupantTokenIdentity<TUser>;

export type CreateOperatorTokenParams<TPlatform extends AbstractPlatform<any, any>> =
    JWTEncodeBase<TPlatform> & OperatorTokenIdentity;

export type CreateTokenParams<
    TUser extends BaseUser,
    TPlatform extends AbstractPlatform<any, any>,
> = CreateUserTokenParams<TUser, TPlatform> | CreateOperatorTokenParams<TPlatform>;

/** Identity fields for minting a token, without platform init context. */
export type CreateTokenIdentity<TUser extends BaseUser> = {
    maxAge?: number;
    room: string;
} & (OccupantTokenIdentity<TUser> | OperatorTokenIdentity);

export type JWTEncodeParams<
    TUser extends BaseUser,
    TPlatform extends AbstractPlatform<any, any>,
> = JWTEncodeBase<TPlatform> & JwtTokenIdentity<TUser>;

export const isOperatorToken = <T extends { kind?: ParticipantKind | undefined }>(
    params: T,
): params is T & { kind: "operator" } => {
    return params.kind === "operator";
};

export interface AuthorizeParams {
    platform: AbstractPlatform<any, any>;
    secret: string;
}

export interface AuthorizeModule {
    decode: <TUser extends BaseUser>(jwt: string) => Promise<JWT<TUser> | null>;
    encode: <TUser extends BaseUser, TPlatform extends AbstractPlatform<any, any>>(
        params: JWTEncodeParams<TUser, TPlatform>,
    ) => Promise<string>;
}

const now = () => (Date.now() / 1_000) | 0;

const maxAgeMsToSeconds = (maxAgeMs: number): number => {
    return Math.max(1, Math.ceil(maxAgeMs / 1_000));
};

const resolveJwtIdentity = <TUser extends BaseUser>(
    params: JwtTokenIdentity<TUser> & { room: string },
): JWT<TUser> => {
    const { room } = params;

    switch (params.kind) {
        case "operator": {
            const { operator, user } = params;

            return {
                kind: "operator",
                operator,
                room,
                sub: `${room}|operator|${operator.id}`,
                user,
            };
        }
        case "user":
        case undefined: {
            const { user } = params;

            return {
                kind: "user",
                operator: null,
                room,
                sub: `${room}|${user.id}`,
                user,
            };
        }
        default:
            return assertExhaustive(params);
    }
};

export const authorize = (params: AuthorizeParams) => {
    const { platform, secret } = params;

    const encode = async <TUser extends BaseUser, TPlatform extends AbstractPlatform<any, any>>(
        encodeParams: JWTEncodeParams<TUser, TPlatform>,
    ): Promise<string> => {
        const { maxAge = DEFAULT_MAX_AGE_MS } = encodeParams as JWTEncodeBase<TPlatform>;
        const claims = resolveJwtIdentity(encodeParams);

        const encryptionSecret = await getEncryptionKey(secret);

        const token = await new EncryptJWT({ ...claims })
            .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
            .setIssuedAt()
            .setExpirationTime(now() + maxAgeMsToSeconds(maxAge))
            .setJti(platform.randomUUID())
            .encrypt(encryptionSecret);

        return token;
    };

    const decode = async <TUser extends BaseUser>(jwt: string): Promise<JWT<TUser> | null> => {
        try {
            const encryptionSecret = await getEncryptionKey(secret);

            const { payload } = await jwtDecrypt(jwt, encryptionSecret, {
                clockTolerance: 15,
            });

            const decoded = (payload as unknown as JWT<TUser> | undefined) ?? null;

            if (!decoded) return null;

            const kind = decoded.kind as ParticipantKind | undefined;

            switch (kind) {
                case "operator":
                    return {
                        kind: "operator",
                        operator: decoded.operator,
                        room: decoded.room,
                        sub: decoded.sub,
                        user: decoded.user,
                    };
                case "user":
                case undefined:
                    return {
                        kind: "user",
                        operator: null,
                        room: decoded.room,
                        sub: decoded.sub,
                        user: decoded.user,
                    };
                default:
                    return assertExhaustive(kind);
            }
        } catch {
            return null;
        }
    };

    return { decode, encode };
};
