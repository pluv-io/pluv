import { expect, test } from "@playwright/test";
import { oneLine } from "common-tags";
import ms from "ms";
import { openTestPage, waitMs } from "../../../../utils";

const TEST_URL = "http://localhost:3100/loro/node/storage";

test.describe("Node Storage", () => {
    test(
        oneLine`
			connect 1 ->
			verify storage on 1
		`,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-storage-1`;

            const firstPage = await openTestPage(testUrl);

            await firstPage.waitForSelector("#storage-room");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#storage")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((messages) => expect(messages.length).toEqual(1));

            await firstPage.close();
        },
    );

    test(
        oneLine`
            connect 1 ->
            connect 2 ->
            verify storage on 1 + 2 ->
            add message on 1 ->
            verify storage on 1 + 2 ->
            add mesage on 2 ->
            verify storage on 1 + 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-storage-2`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(testUrl);

            await Promise.all([firstPage.waitForSelector("#storage"), secondPage.waitForSelector("#storage")]);

            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#storage")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((messages) => expect(messages.length).toEqual(1));

            await secondPage
                .locator("#storage")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((messages) => expect(messages.length).toEqual(1));

            await firstPage.click("#button-add-message");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#storage")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((messages) => expect(messages.length).toEqual(2));

            await secondPage
                .locator("#storage")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((messages) => expect(messages.length).toEqual(2));

            await secondPage.click("#button-add-message");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#storage")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((messages) => expect(messages.length).toEqual(3));

            await secondPage
                .locator("#storage")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((messages) => expect(messages.length).toEqual(3));

            await firstPage.close();
            await secondPage.close();
        },
    );

    test(
        oneLine`
            connect 1 ->
            add message on 1 ->
            connect 2 ->
            verify storage on 2 ->
            disconnect 1 ->
            add message on 2 ->
            connect 1 ->
            verify storage on 1 ->
            disconnect 1 ->
            disconnect 2 ->
            connect 1 ->
            verify storage on 1 + 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-storage-3`;

            const firstPage = await openTestPage(testUrl);

            await firstPage.waitForSelector("#storage");
            await waitMs(ms("0.25s"));

            await firstPage.click("#button-add-message");
            await waitMs(ms("0.25s"));

            const secondPage = await openTestPage(testUrl);

            await secondPage.waitForSelector("#storage");
            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#storage")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((messages) => expect(messages.length).toEqual(2));

            await firstPage.click("#disconnect-room");
            await waitMs(ms("0.25s"));

            await secondPage.click("#button-add-message");
            await waitMs(ms("0.25s"));

            await firstPage.click("#connect-room");
            await firstPage.waitForSelector("#storage-room");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#storage")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((messages) => expect(messages.length).toEqual(3));

            await firstPage.click("#disconnect-room");
            await secondPage.click("#disconnect-room");
            await waitMs(ms("0.25s"));

            await firstPage.click("#connect-room");
            await firstPage.waitForSelector("#storage-room");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#storage")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((messages) => expect(messages.length).toEqual(1));

            await firstPage.close();
            await secondPage.close();
        },
    );
});
