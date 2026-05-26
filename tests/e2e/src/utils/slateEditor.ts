import type { Page } from "@playwright/test";

export const typeInSlateEditable = async (page: Page, text: string) => {
    await page.locator("#slate-editable").click();
    await page.keyboard.type(text);
};

export const clearSlateEditable = async (page: Page) => {
    await page.locator("#slate-editable").click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.press("Backspace");
};
