import test from "@playwright/test";
import ms from "ms";
import {
    clearSlateEditable,
    expectSlateEditableText,
    openTestPage,
    typeInSlateEditable,
    waitMs,
} from "../../../../utils";

const TEST_URL = "http://localhost:3100/yjs/cloudflare/slate";

test.describe("CloudflareSQLite Slate", () => {
    test("slate", async () => {
        const testUrl = `${TEST_URL}?room=sqlite-e2e-slate-1`;

        const firstPage = await openTestPage(testUrl);
        const secondPage = await openTestPage(testUrl);

        await Promise.all([
            firstPage.waitForSelector("#slate-editable"),
            secondPage.waitForSelector("#slate-editable"),
        ]);

        await waitMs(ms("1s"));

        await typeInSlateEditable(firstPage, "hello world");
        await expectSlateEditableText(secondPage, "hello world");

        await clearSlateEditable(secondPage);
        await expectSlateEditableText(secondPage, "");
        await expectSlateEditableText(firstPage, "");

        await firstPage.close();
        await secondPage.close();
    });
});
