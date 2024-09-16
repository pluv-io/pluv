import { expect, test } from "@playwright/test";
import { oneLine } from "common-tags";
import ms from "ms";
import { openTestPage, waitMs } from "../../../../utils";

const TEST_URL = "http://localhost:3100/yjs/node/broadcast";

test.describe("Node Broadcast", () => {
    test(
        oneLine`
        
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-broadcast-1`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(testUrl);

            await Promise.all([
                firstPage.waitForSelector("broadcast-room"),
                secondPage.waitForSelector("broadcast-room"),
            ]);

            await waitMs(ms("0.25s"));

            await firstPage
                .locator("doubled-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(0));

            await secondPage
                .locator("doubled-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(0));

            await firstPage
                .locator("subtracted-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(0));

            await secondPage
                .locator("subtracted-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(0));

            await firstPage.click("#button-subtract-from-7");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("doubled-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(4));

            await secondPage
                .locator("doubled-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(4));

            await firstPage
                .locator("subtracted-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(2));

            await secondPage
                .locator("subtracted-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(2));

            await secondPage.click("#button-subtract-from-11");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("doubled-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(12));

            await secondPage
                .locator("doubled-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(12));

            await firstPage
                .locator("subtracted-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(6));

            await secondPage
                .locator("subtracted-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(6));

            await firstPage.click("#button-subtract-from-17");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("doubled-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(24));

            await secondPage
                .locator("doubled-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(24));

            await firstPage
                .locator("subtracted-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(12));

            await secondPage
                .locator("subtracted-value")
                .innerText()
                .then((text) => Number.parseInt(text))
                .then((value) => expect(value).toEqual(12));

            await firstPage.close();
            await secondPage.close();
        },
    );
});
