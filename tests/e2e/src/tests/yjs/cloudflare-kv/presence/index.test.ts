import { expect, test } from "@playwright/test";
import { oneLine } from "common-tags";
import ms from "ms";
import { openTestPage, waitMs } from "../../../../utils";

const TEST_URL = "http://localhost:3100/yjs/cloudflare/presence";

test.describe("Cloudflare Presence", () => {
    test(
        oneLine`
            connect 1 ->
            connect 2 ->
            verify others on 1 + 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=kv-e2e-presence-1`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(testUrl);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("1s"));

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
        },
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
            const testUrl = `${TEST_URL}?room=kv-e2e-presence-2`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(testUrl);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("1s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(0));

            await firstPage.click("#button-increment-count");
            await waitMs(ms("1s"));

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
        },
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
            const testUrl = `${TEST_URL}?room=kv-e2e-presence-3`;

            const firstPage = await openTestPage(testUrl);

            await firstPage.waitForSelector("#presence-room");
            await waitMs(ms("1s"));

            await firstPage
                .locator("#my-presence")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json.count)
                .then((count) => expect(count).toEqual(0));

            await firstPage.click("#button-increment-count");
            await waitMs(ms("1s"));

            await firstPage
                .locator("#my-presence")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json.count)
                .then((count) => expect(count).toEqual(1));

            const secondPage = await openTestPage(testUrl);

            await secondPage.waitForSelector("#presence-room");
            await waitMs(ms("1s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(1));

            await firstPage.close();
            await secondPage.close();
        },
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
            const testUrl = `${TEST_URL}?room=kv-e2e-presence-4`;

            const firstPage = await openTestPage(testUrl);
            const secondPage = await openTestPage(testUrl);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("1s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json[0].presence.count)
                .then((count) => expect(count).toEqual(0));

            await firstPage.click("#button-increment-count");
            await waitMs(ms("1s"));

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
            await waitMs(ms("1s"));

            await secondPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((json) => json)
                .then((others) => expect(others.length).toEqual(0));

            await firstPage.click("#connect-room");
            await firstPage.waitForSelector("#presence-room");
            await waitMs(ms("1s"));

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
        },
    );

    test(
        oneLine`
            connect 1 ->
            connect 2 ->
            verify others on 1 + 2 ->
            connect 1 again ->
            verify others on 1 + 2
        `,
        async () => {
            const testUrl = `${TEST_URL}?room=kv-e2e-presence-repeat-user`;

            const firstPage = await openTestPage(`${testUrl}&user_id=user_1`);
            const secondPage = await openTestPage(`${testUrl}&user_id=user_2`);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("1s"));

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

            const thirdPage = await openTestPage(`${testUrl}&user_id=user_1`);

            await Promise.all([
                firstPage.waitForSelector("#presence-room"),
                secondPage.waitForSelector("#presence-room"),
                thirdPage.waitForSelector("#presence-room"),
            ]);

            await waitMs(ms("1s"));

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

            await thirdPage
                .locator("#others")
                .innerText()
                .then((text) => JSON.parse(text))
                .then((others) => expect(others.length).toEqual(1));

            await firstPage.close();
            await secondPage.close();
            await thirdPage.close();
        },
    );
});
