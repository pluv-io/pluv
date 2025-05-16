import test, { expect } from "@playwright/test";
import ms from "ms";
import { openTestPage, waitMs } from "../../../../utils";

const TEST_URL = "http://localhost:3100/yjs/cloudflare/blocknote";

test.describe("CloudflareSQLite blocknote", () => {
    test("blocknote", async () => {
        const testUrl = `${TEST_URL}?room=sqlite-e2e-blocknote-1`;

        const firstPage = await openTestPage(testUrl);
        const secondPage = await openTestPage(testUrl);

        await Promise.all([
            firstPage.waitForSelector('#blocknote-editable [contenteditable="true"]'),
            secondPage.waitForSelector('#blocknote-editable [contenteditable="true"]'),
        ]);

        await waitMs(ms("1s"));

        await firstPage.locator('#blocknote-editable [contenteditable="true"]').fill("hello world");
        await waitMs(ms("0.25s"));

        await secondPage
            .locator('#blocknote-editable [contenteditable="true"]')
            .innerText()
            .then((text) => expect(text.trim()).toEqual("hello world"));
        await waitMs(ms("0.25s"));

        await secondPage.locator('#blocknote-editable [contenteditable="true"]').clear();
        await waitMs(ms("0.25s"));

        await firstPage
            .locator('#blocknote-editable [contenteditable="true"]')
            .innerText()
            .then((text) => expect(text.trim()).toEqual(""));

        await firstPage.close();
        await secondPage.close();
    });
});
