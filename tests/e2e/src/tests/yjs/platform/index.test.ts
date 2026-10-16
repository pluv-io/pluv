import { expect, test } from "@playwright/test";
import { openTestPage } from "../../../utils";

const TEST_URL = "http://localhost:3100/yjs/platform";

test("connect, broadcast, presence, and storage", async () => {
    const testUrl = `${TEST_URL}?room=platform-e2e-1`;
    const firstPage = await openTestPage(testUrl);
    const secondPage = await openTestPage(testUrl);

    await Promise.all([
        firstPage.waitForSelector("#connection-id"),
        secondPage.waitForSelector("#connection-id"),
    ]);

    await expect
        .poll(async () => JSON.parse(await firstPage.locator("#others").innerText()))
        .toHaveLength(1);
    await expect
        .poll(async () => JSON.parse(await secondPage.locator("#others").innerText()))
        .toHaveLength(1);
    await expect
        .poll(async () => JSON.parse(await firstPage.locator("#storage").innerText()))
        .toHaveLength(1);

    await firstPage.click("#button-broadcast");
    await expect.poll(async () => secondPage.locator("#heard").innerText()).toBe("ping");

    await firstPage.click("#button-broadcast-slow");
    await expect(secondPage.locator("#heard-slow")).toHaveText("", { timeout: 250 });
    await expect
        .poll(async () => secondPage.locator("#heard-slow").innerText(), { timeout: 10_000 })
        .toBe("later");

    await firstPage.click("#button-increment-count");
    await expect
        .poll(async () => {
            const others = JSON.parse(await secondPage.locator("#others").innerText()) as {
                presence: { count: number };
            }[];

            return others[0]?.presence.count;
        })
        .toBe(1);

    await firstPage.click("#button-add-message");
    await expect
        .poll(async () => JSON.parse(await firstPage.locator("#storage").innerText()))
        .toHaveLength(2);
    await expect
        .poll(async () => JSON.parse(await secondPage.locator("#storage").innerText()))
        .toHaveLength(2);

    await firstPage.close();
    await secondPage.close();
});
