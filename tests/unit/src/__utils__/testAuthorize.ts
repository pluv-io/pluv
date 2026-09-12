import type { CreateIOParams, InferIORoom, PluvIO, PluvServer } from "@pluv/io";
import { createIO } from "@pluv/io";
import type { BaseUser } from "@pluv/types";
import { z } from "zod";
import { TestPlatform } from "./TestPlatform";
import type { TestPlatformConfig } from "./TestPlatform";
import type { TestSocket } from "./TestWebSocket";

export const TEST_AUTH_SECRET = "unit-test-auth-secret";

export const testAuthorizeUser = z.object({
    id: z.string(),
});

export type TestAuthorizeUser = z.infer<typeof testAuthorizeUser>;

export const testAuthorize = {
    secret: TEST_AUTH_SECRET,
    user: testAuthorizeUser,
} as const;

type TestCreateIOOptions = Omit<
    CreateIOParams<TestPlatform, {}, TestAuthorizeUser, any>,
    "authorize" | "platform"
> & {
    platform?: TestPlatformConfig | (() => TestPlatform);
};

export const createAuthorizedIO = <TCrdt extends CreateIOParams<any, any, any, any>["crdt"]>(
    options: TestCreateIOOptions & { crdt?: TCrdt } = {},
) => {
    const { platform, ...rest } = options;
    const platformFactory =
        typeof platform === "function"
            ? platform
            : () => new TestPlatform(platform ?? { mode: "detached" });

    return createIO({
        authorize: testAuthorize,
        platform: platformFactory,
        ...rest,
    });
};

export const createAuthorizedToken = async (
    io: PluvIO<any, any, any, any>,
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

export const registerAuthorized = async <TServer extends PluvServer<any, any, any, any, any>>(
    room: InferIORoom<TServer>,
    socket: TestSocket,
    params: {
        io: PluvIO<any, any, any, any>;
        user?: TestAuthorizeUser & BaseUser;
    },
): Promise<void> => {
    const token = await createAuthorizedToken(params.io, {
        room: room.id,
        user: params.user ?? { id: socket.id },
    });

    await room.register(socket, { token });
};
