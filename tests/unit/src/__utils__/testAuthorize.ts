import { yjs } from "@pluv/crdt-yjs";
import { loro } from "@pluv/crdt-loro";
import type { InferIORoom, IOConfigParams, PluvIO, PluvServer } from "@pluv/io";
import { createIO } from "@pluv/io";
import { createTreaty, type Treaty } from "@pluv/treaty";
import type { BaseUser, TreatyLike } from "@pluv/types";
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

export const createAuthorizedToken = async (
    io: PluvIO<any>,
    params: {
        room: string;
        user?: TestAuthorizeUser;
    },
): Promise<string> => {
    const { room, user = { id: "test-user" } } = params;

    return await io.createToken({
        room,
        user,
    });
};

export const registerAuthorized = async <TServer extends PluvServer<any>>(
    room: InferIORoom<TServer>,
    socket: TestSocket,
    params: {
        io: PluvIO<any>;
        user?: TestAuthorizeUser & BaseUser;
    },
): Promise<void> => {
    const token = await createAuthorizedToken(params.io, {
        room: room.id,
        user: params.user ?? { id: socket.id },
    });

    await room.register(socket, { token });
};
