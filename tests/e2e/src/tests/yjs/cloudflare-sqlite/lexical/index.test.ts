import test, { expect } from "@playwright/test";
import ms from "ms";
import { openTestPage, waitMs } from "../../../../utils";

const TEST_URL = "http://localhost:3100/yjs/cloudflare/lexical";

test.describe("CloudflareSQLite lexical", () => {
    test("lexical", async () => {
        const testUrl = `${TEST_URL}?room=sqlite-e2e-lexical-1`;

        const firstPage = await openTestPage(testUrl);
        const secondPage = await openTestPage(testUrl);

        await Promise.all([
            firstPage.waitForSelector("#lexical-editable"),
            secondPage.waitForSelector("#lexical-editable"),
        ]);

        await waitMs(ms("1s"));

        await firstPage.locator("#lexical-editable").fill("hello world");
        await waitMs(ms("0.25s"));

        await secondPage
            .locator("#lexical-editable")
            .innerText()
            .then((text) => expect(text.trim()).toEqual("hello world"));
        await waitMs(ms("0.25s"));

        await secondPage.locator("#lexical-editable").clear();
        await waitMs(ms("0.25s"));

        await firstPage
            .locator("#lexical-editable")
            .innerText()
            .then((text) => expect(text.trim()).toEqual(""));

        await firstPage.close();
        await secondPage.close();
    });
});
