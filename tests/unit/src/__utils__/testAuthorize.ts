import { yjs } from "@pluv/crdt-yjs";
import { loro } from "@pluv/crdt-loro";
import type { InferIORoom, IOConfigParams, PluvServer } from "@pluv/io";
import { createIO } from "@pluv/io";
import { createTreaty, type Treaty } from "@pluv/treaty";
import type { BaseUser, OperatorUser, TreatyLike } from "@pluv/types";
import { z } from "zod";
import { TestPlatform } from "./TestPlatform";
import type { TestPlatformConfig } from "./TestPlatform";
import type { TestSocket } from "./TestWebSocket";

export const TEST_AUTH_SECRET = "unit-test-auth-secret";

export const testAuthorizeUser = z.object({
    id: z.string(),
});

export type TestAuthorizeUser = z.infer<typeof testAuthorizeUser>;

export const testTreaty = createTreaty({
    user: testAuthorizeUser,
});

type TestYjsStorage = ReturnType<typeof yjs.schema<{}>>;
type TestYjsTreaty = Treaty<typeof testAuthorizeUser, undefined, TestYjsStorage>;

export const testYjsTreaty: TestYjsTreaty = createTreaty({
    user: testAuthorizeUser,
    storage: yjs.schema({}),
});

export const testLoroTreaty = createTreaty({
    user: testAuthorizeUser,
    storage: loro.schema({}),
});

export const testAuthorize = {
    secret: TEST_AUTH_SECRET,
    user: testAuthorizeUser,
} as const;

type TestCreateIOOptions<TTreaty extends TreatyLike = typeof testTreaty> = Omit<
    IOConfigParams<TestPlatform, TTreaty>,
    "secret" | "treaty"
> & {
    platform?: TestPlatformConfig | (() => TestPlatform);
    secret?: string;
    treaty?: TTreaty;
};

export const createAuthorizedIO = <TTreaty extends TreatyLike = typeof testTreaty>(
    options: TestCreateIOOptions<TTreaty> = {} as TestCreateIOOptions<TTreaty>,
) => {
    const {
        platform,
        secret = TEST_AUTH_SECRET,
        treaty = testTreaty as unknown as TTreaty,
        ...rest
    } = options;
    const platformFactory =
        typeof platform === "function"
            ? platform
            : () => new TestPlatform(platform ?? { mode: "detached" });

    return createIO()
        .platform(platformFactory)
        .config({
            secret,
            treaty,
            ...rest,
        });
};

export const testOperatorUser: OperatorUser = {
    id: "staff-1",
    name: "Ada Lovelace",
    imageUrl: null,
};

export const testOperatorTokenUser = {
    ...testOperatorUser,
    email: "ada@pluv.io",
};

type UserTokenSource = {
    createToken(params: { room: string; user: TestAuthorizeUser }): Promise<string>;
};

type OperatorTokenSource = {
    createToken(params: {
        kind: "operator";
        operator: OperatorUser & { email: string };
        room: string;
    }): Promise<string>;
};

type CreateTokenSource = UserTokenSource | OperatorTokenSource;

export const createAuthorizedToken = async (
    io: CreateTokenSource,
    params: {
        room: string;
        user?: TestAuthorizeUser;
        kind?: "user" | "operator";
        operator?: OperatorUser & { email: string };
    },
): Promise<string> => {
    const { room, user = { id: "test-user" } } = params;

    if (params.kind === "operator") {
        return await (io as OperatorTokenSource).createToken({
            room,
            kind: "operator",
            operator: params.operator ?? testOperatorTokenUser,
        });
    }

    return await (io as UserTokenSource).createToken({
        room,
        user,
    });
};

export const registerAuthorized = async <TServer extends PluvServer<any>>(
    room: InferIORoom<TServer>,
    socket: TestSocket,
    params: {
        io: CreateTokenSource;
        user?: TestAuthorizeUser & BaseUser;
        kind?: "user" | "operator";
        operator?: OperatorUser & { email: string };
    },
): Promise<void> => {
    const token = await createAuthorizedToken(params.io, {
        room: room.id,
        user: params.user ?? { id: socket.id },
        kind: params.kind,
        operator: params.operator,
    });

    await room.register(socket, { token });
};
