import { closeApp } from "../../terminal";

export const done = (text: string, code: number): void => {
    void closeApp(text, code);
};
