import { expect, type Page } from "@playwright/test";

const slateEditable = (page: Page) => page.locator("#slate-editable");

const getSlateEditableText = async (page: Page) => {
    return slateEditable(page)
        .innerText()
        .then((text) => text.trim());
};

export const typeInSlateEditable = async (page: Page, text: string) => {
    const editable = slateEditable(page);
    await editable.click();
    await editable.pressSequentially(text);
};

export const clearSlateEditable = async (page: Page) => {
    const editable = slateEditable(page);
    await editable.click();
    await editable.press("ControlOrMeta+a");
    await editable.press("Delete");

    if ((await getSlateEditableText(page)).length > 0) {
        await editable.click({ clickCount: 3 });
        await editable.press("Delete");
    }

    if ((await getSlateEditableText(page)).length > 0) {
        await editable.click();
        await editable.press("ControlOrMeta+End");

        for (let i = 0; i < 64; i++) {
            // Each Backspace depends on the previous DOM read.
            // oxlint-disable-next-line eslint/no-await-in-loop
            if ((await getSlateEditableText(page)).length === 0) {
                break;
            }

            // oxlint-disable-next-line eslint/no-await-in-loop
            await editable.press("Backspace");
        }
    }

    await expect.poll(() => getSlateEditableText(page), { timeout: 5_000 }).toBe("");
};

export const expectSlateEditableText = async (page: Page, expected: string) => {
    await expect.poll(() => getSlateEditableText(page), { timeout: 10_000 }).toBe(expected);
};
