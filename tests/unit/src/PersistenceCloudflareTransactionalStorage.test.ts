import { PersistenceCloudflareTransactionalStorage } from "@pluv/persistence-cloudflare-transactional-storage";
import { describe, expect, it } from "vitest";
import { createMockDurableObjectState } from "./__utils__";

const ROOM_ID = "home-page";
const LATEST_SNAPSHOT = "snapshot-after-second-edit";

describe("PersistenceCloudflareTransactionalStorage", () => {
    it("writes and reads on the instance returned by initialize", async () => {
        const persistence = new PersistenceCloudflareTransactionalStorage({
            mode: "sqlite",
        }).initialize({ state: createMockDurableObjectState() });

        await persistence.setStorageState(ROOM_ID, LATEST_SNAPSHOT);

        await expect(persistence.getStorageState(ROOM_ID)).resolves.toBe(LATEST_SNAPSHOT);
    });

    it("keeps writes across a new initialize with the same Durable Object state", async () => {
        const state = createMockDurableObjectState();

        await new PersistenceCloudflareTransactionalStorage({ mode: "sqlite" })
            .initialize({ state })
            .setStorageState(ROOM_ID, LATEST_SNAPSHOT);

        const revived = new PersistenceCloudflareTransactionalStorage({
            mode: "sqlite",
        }).initialize({ state });

        await expect(revived.getStorageState(ROOM_ID)).resolves.toBe(LATEST_SNAPSHOT);
    });
});
