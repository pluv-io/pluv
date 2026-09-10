import { PersistenceCloudflareTransactionalStorage } from "@pluv/persistence-cloudflare-transactional-storage";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { beforeAll, describe, expect, it } from "vitest";
import { createMockDurableObjectState, TestPersistence } from "./__utils__";

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
        const { platform } = platformCloudflare();
        const initialized = platform().initialize({
            roomContext: { env: {}, state: createMockDurableObjectState() },
        });

        expect(initialized.persistence).toBeInstanceOf(PersistenceCloudflareTransactionalStorage);
    });

    it("keeps $updateStorage writes across a new platform() after hibernation", async () => {
        const { platform } = platformCloudflare();
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

        const { platform } = platformCloudflare({ persistence });
        const initialized = platform().initialize({
            roomContext: { env: {}, state: createMockDurableObjectState() },
        });

        expect(initialized.persistence).toBeInstanceOf(TestPersistence);
        await expect(initialized.persistence.getStorageState("home-page")).resolves.toBe("custom");
    });
});
