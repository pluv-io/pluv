import { JS_IDENTIFIER } from "../constants";
import { oneLine } from "./oneLine";

export type AssertEventNamesOptions = {
    allowDollar?: boolean;
};

export const assertEventNames = (
    names: readonly string[],
    options: AssertEventNamesOptions = {},
): void => {
    const allowDollar = options.allowDollar ?? false;

    for (const name of names) {
        if (!allowDollar && name.includes("$")) {
            throw new Error(oneLine`
                Invalid event name. Event names must not contain $: "${name}"
            `);
        }

        if (!JS_IDENTIFIER.test(name)) {
            throw new Error(
                `Invalid event name. Event names must be formatted as valid JavaScript variable names: "${name}"`,
            );
        }
    }
};
