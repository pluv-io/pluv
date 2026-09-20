import { expect, type Page } from "@playwright/test";

const lexicalEditable = (page: Page) => page.locator("#lexical-editable");

const getLexicalEditableText = async (page: Page) => {
    return lexicalEditable(page)
        .innerText()
        .then((text) => text.trim());
};

export const typeInLexicalEditable = async (page: Page, text: string) => {
    const editable = lexicalEditable(page);
    await editable.click();
    await editable.pressSequentially(text, { delay: 20 });
};

export const clearLexicalEditable = async (page: Page) => {
    const editable = lexicalEditable(page);
    await editable.click();
    await editable.press("ControlOrMeta+a");
    await editable.press("Delete");

    if ((await getLexicalEditableText(page)).length > 0) {
        await editable.click({ clickCount: 3 });
        await editable.press("Delete");
    }

    if ((await getLexicalEditableText(page)).length > 0) {
        await editable.click();
        await editable.press("ControlOrMeta+End");

        for (let i = 0; i < 64; i++) {
            // Each Backspace depends on the previous DOM read.
            // oxlint-disable-next-line eslint/no-await-in-loop
            if ((await getLexicalEditableText(page)).length === 0) {
                break;
            }

            // oxlint-disable-next-line eslint/no-await-in-loop
            await editable.press("Backspace");
        }
    }

    await expect.poll(() => getLexicalEditableText(page), { timeout: 5_000 }).toBe("");
};

export const expectLexicalEditableText = async (page: Page, expected: string) => {
    await expect.poll(() => getLexicalEditableText(page), { timeout: 10_000 }).toBe(expected);
};
