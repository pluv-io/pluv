import { expect, test } from "@playwright/test";
import { oneLine } from "common-tags";
import ms from "ms";
import { openTestPage, waitMs } from "../../../utils";

const TEST_URL = "http://localhost:3100/node-redis/presence";

test.describe("Node Redis Presence", () => {
    test(
        oneLine`
            connect 1 ->
            connect 2 ->
            verify others on 1 + 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-presence-1`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(testUrl);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((others) => expect(others.length).toEqual(1));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((others) => expect(others.length).toEqual(1));

            await firstPage.close();
            await secondPage.close();
        }
    );

    test(
        oneLine`
            connect 1 ->
            connect 2 ->
            update presence 1 ->
            verify presence 1 on 1 ->
            verify presence 1 on 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-presence-2`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(testUrl);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(0));

            await firstPage.click("#button-increment-count");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#my-presence")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json.count)
                .then((count) => expect(count).toEqual(1));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(1));

            await firstPage.close();
            await secondPage.close();
        }
    );

    test(
        oneLine`
            connect 1 ->
            update presence 1 ->
            verify presence 1 on 1 ->
            connect 2 ->
            verify presence 1 on 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-presence-3`;

            const firstPage = await openTestPage(testUrl);

            await firstPage.waitForSelector("#presence-room");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#my-presence")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json.count)
                .then((count) => expect(count).toEqual(0));

            await firstPage.click("#button-increment-count");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#my-presence")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json.count)
                .then((count) => expect(count).toEqual(1));

            const secondPage = await openTestPage(testUrl);

            await secondPage.waitForSelector("#presence-room");
            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(1));

            await firstPage.close();
            await secondPage.close();
        }
    );

    test(
        oneLine`
            connect 1 ->
            connect 2 ->
            update presence 1 ->
            verify presence 1 on 2 ->
            verify others on 1 + 2 ->
            disconnect 1 ->
            verify others on 2
            connect 1 ->
            verify presence 1 on 2 ->
            verify others on 1 + 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-presence-4`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(testUrl);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(0));

            await firstPage.click("#button-increment-count");
            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json)
                .then((others) => {
                    expect(others.length).toEqual(1);
                    expect(others[0].presence.count).toEqual(1);
                });

            await firstPage.click("#disconnect-room");
            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json)
                .then((others) => expect(others.length).toEqual(0));

            await firstPage.click("#connect-room");
            await firstPage.waitForSelector("#presence-room");
            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json)
                .then((others) => {
                    expect(others.length).toEqual(1);
                    expect(others[0].presence.count).toEqual(0);
                });

            await firstPage.close();
            await secondPage.close();
        }
    );

    test(
        oneLine`
            connect 1 to pluv1 ->
            connect 2 to pluv2 ->
            verify others on 1 + 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-presence-5`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(`${testUrl}_1`);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((others) => expect(others.length).toEqual(1));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((others) => expect(others.length).toEqual(1));

            await firstPage.close();
            await secondPage.close();
        }
    );

    test(
        oneLine`
            connect 1 to pluv1 ->
            connect 2 to pluv2 ->
            update presence 1 ->
            verify presence 1 on 1 ->
            verify presence 1 on 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-presence-6`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(`${testUrl}_1`);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(0));

            await firstPage.click("#button-increment-count");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#my-presence")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json.count)
                .then((count) => expect(count).toEqual(1));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(1));

            await firstPage.close();
            await secondPage.close();
        }
    );

    test(
        oneLine`
            connect 1 to pluv1 ->
            update presence 1 ->
            verify presence 1 on 1 ->
            connect 2 to pluv2 ->
            verify presence 1 on 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-presence-7`;

            const firstPage = await openTestPage(testUrl);

            await firstPage.waitForSelector("#presence-room");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#my-presence")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json.count)
                .then((count) => expect(count).toEqual(0));

            await firstPage.click("#button-increment-count");
            await waitMs(ms("0.25s"));

            await firstPage
                .locator("#my-presence")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json.count)
                .then((count) => expect(count).toEqual(1));

            const secondPage = await openTestPage(`${testUrl}_1`);

            await secondPage.waitForSelector("#presence-room");
            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(1));

            await firstPage.close();
            await secondPage.close();
        }
    );

    test(
        oneLine`
            connect 1 on pluv1 ->
            connect 2 on pluv2 ->
            update presence 1 ->
            verify presence 1 on 2 ->
            verify others on 1 + 2 ->
            disconnect 1 ->
            verify others on 2
            connect 1 on pluv1 ->
            verify presence 1 on 2 ->
            verify others on 1 + 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=e2e-presence-8`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(`${testUrl}_1`);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(0));

            await firstPage.click("#button-increment-count");
            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json)
                .then((others) => {
                    expect(others.length).toEqual(1);
                    expect(others[0].presence.count).toEqual(1);
                });

            await firstPage.click("#disconnect-room");
            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json)
                .then((others) => expect(others.length).toEqual(0));

            await firstPage.click("#connect-room");
            await firstPage.waitForSelector("#presence-room");
            await waitMs(ms("0.25s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json)
                .then((others) => {
                    expect(others.length).toEqual(1);
                    expect(others[0].presence.count).toEqual(0);
                });

            await firstPage.close();
            await secondPage.close();
        }
    );
});
