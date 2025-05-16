import test, { expect } from "@playwright/test";
import ms from "ms";
import { openTestPage, waitMs } from "../../../../utils";

const TEST_URL = "http://localhost:3100/yjs/cloudflare/blocknote";

const stripUsername = (text: string): string => {
    return text
        .replace(/[\s\n\r]*test[\s\n\r]*/gi, "")
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
        .trim();
};

test.describe("CloudflareSQLite blocknote", () => {
    test("blocknote", async () => {
        const testUrl = `${TEST_URL}?room=sqlite-e2e-blocknote-1&user=test`;

        const firstPage = await openTestPage(testUrl);
        const secondPage = await openTestPage(testUrl);

        const selector = '#blocknote-editable [contenteditable="true"]';

        await Promise.all([
            firstPage.waitForSelector(selector),
            secondPage.waitForSelector(selector),
        ]);

        await waitMs(ms("1s"));

        await firstPage.locator(selector).fill("hello world");
        await waitMs(ms("0.25s"));

        await secondPage
            .locator(selector)
            .innerText()
            .then((text) => expect(stripUsername(text)).toEqual("hello world"));
        await waitMs(ms("0.25s"));

        await secondPage.locator(selector).fill("");
        await waitMs(ms("0.25s"));

        await firstPage
            .locator(selector)
            .innerText()
            .then((text) => expect(stripUsername(text)).toEqual(""));

        await firstPage.close();
        await secondPage.close();
    });
});
