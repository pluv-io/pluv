import test, { expect } from "@playwright/test";
import ms from "ms";
import { openTestPage, waitMs } from "../../../../utils";

const TEST_URL = "http://localhost:3100/yjs/node/slate";

test.describe("Node Slate", () => {
    test("slate", async () => {
        const testUrl = `${TEST_URL}?room=e2e-slate-1`;

        const firstPage = await openTestPage(testUrl);
        const secondPage = await openTestPage(testUrl);

        await Promise.all([
            firstPage.waitForSelector("#slate-editable"),
            secondPage.waitForSelector("#slate-editable"),
        ]);

        await waitMs(ms("1ms"));

        await firstPage.locator("#slate-editable").fill("hello world");
        await waitMs(ms("0.25s"));

        await secondPage
            .locator("#slate-editable")
            .innerText()
            .then((text) => expect(text.trim()).toEqual("hello world"));
        await waitMs(ms("0.25s"));

        await secondPage.locator("#slate-editable").clear();
        await waitMs(ms("0.25s"));

        await firstPage
            .locator("#slate-editable")
            .innerText()
            .then((text) => expect(text.trim()).toEqual(""));

        await firstPage.close();
        await secondPage.close();
    });
});
