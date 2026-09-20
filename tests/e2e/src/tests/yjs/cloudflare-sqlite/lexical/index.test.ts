import test from "@playwright/test";
import ms from "ms";
import {
    clearLexicalEditable,
    expectLexicalEditableText,
    openTestPage,
    typeInLexicalEditable,
    waitMs,
} from "../../../../utils";

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

        await typeInLexicalEditable(firstPage, "hello world");
        await expectLexicalEditableText(secondPage, "hello world");

        await clearLexicalEditable(secondPage);
        await expectLexicalEditableText(secondPage, "");
        await expectLexicalEditableText(firstPage, "");

        await firstPage.close();
        await secondPage.close();
    });
});
