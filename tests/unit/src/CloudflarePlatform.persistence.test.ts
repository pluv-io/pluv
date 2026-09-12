import { yjs } from "@pluv/crdt-yjs";
import { PersistenceCloudflareTransactionalStorage } from "@pluv/persistence-cloudflare-transactional-storage";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { beforeAll, describe, expect, it } from "vitest";
import {
    createAuthorizedIO,
    createMockDurableObjectState,
    deferred,
    encodedStateWithContent,
    registerAuthorized,
    testAuthorize,
    TestPersistence,
    TestSocket,
} from "./__utils__";

const LATEST_SNAPSHOT = "snapshot-after-second-edit";

beforeAll(() => {
    class WebSocketRequestResponsePair {
        public constructor(
            public readonly request: string,
            public readonly response: string,
        ) {}
    }

    Object.assign(globalThis, { WebSocketRequestResponsePair });
});

describe("CloudflarePlatform persistence", () => {
    it("uses Durable Object storage after initialize, not the in-memory default", () => {
        const { platform } = platformCloudflare({ authorize: testAuthorize });
        const initialized = platform().initialize({
            roomContext: { env: {}, state: createMockDurableObjectState() },
        });

        expect(initialized.persistence).toBeInstanceOf(PersistenceCloudflareTransactionalStorage);
    });

    it("keeps $updateStorage writes across a new platform() after hibernation", async () => {
        const { platform } = platformCloudflare({ authorize: testAuthorize });
        const state = createMockDurableObjectState();
        const roomContext = { env: {}, state };

        const beforeHibernation = platform().initialize({ roomContext });

        await beforeHibernation.persistence.setStorageState("home-page", LATEST_SNAPSHOT);

        const afterHibernation = platform().initialize({ roomContext });

        await expect(afterHibernation.persistence.getStorageState("home-page")).resolves.toBe(
            LATEST_SNAPSHOT,
        );
    });

    it("keeps a caller-provided persistence adapter", async () => {
        const persistence = new TestPersistence();

        await persistence.setStorageState("home-page", "custom");

        const { platform } = platformCloudflare({ authorize: testAuthorize, persistence });
        const initialized = platform().initialize({
            roomContext: { env: {}, state: createMockDurableObjectState() },
        });

        expect(initialized.persistence).toBeInstanceOf(TestPersistence);
        await expect(initialized.persistence.getStorageState("home-page")).resolves.toBe("custom");
    });

    it("loads Durable Object storage after wake instead of webhook or client seed", async () => {
        const { platform } = platformCloudflare({ authorize: testAuthorize });
        const state = createMockDurableObjectState();
        const roomContext = { env: {}, state };
        const roomId = "home-page";
        const doSnapshot = encodedStateWithContent("do");
        const webhook = deferred<string | null>();
        let reads = 0;

        const beforeHibernation = platform().initialize({ roomContext });

        await beforeHibernation.persistence.setStorageState(roomId, doSnapshot);

        const afterHibernation = platform().initialize({ roomContext });
        const io = createAuthorizedIO({
            crdt: yjs,
            platform: {
                mode: "detached",
                persistence: afterHibernation.persistence,
            },
        });
        const server = io.server({
            getInitialStorage: () => {
                reads += 1;

                return webhook.promise;
            },
        });
        const room = server.createRoom(roomId, { env: {}, state } as never);
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        expect(reads).toBe(0);

        webhook.resolve(encodedStateWithContent("webhook"));
        await room.onMessage(socket)({
            data: JSON.stringify({
                type: "$initializeSession",
                data: { presence: {}, update: encodedStateWithContent("client") },
            }),
        });

        const received = [...socket.messages]
            .reverse()
            .find((message) => message.type === "$storageReceived");
        const doc = yjs
            .doc(() => ({}))
            .getEmpty()
            .applyEncodedState({ update: received?.data.state });

        expect((doc.toJson() as { content?: string }).content).toBe("do");
        expect(reads).toBe(0);

        doc.destroy();
    });
});
