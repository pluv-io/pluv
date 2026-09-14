import { oneLine } from "./oneLine";

const JS_IDENTIFIER = /^[a-z_$][a-z0-9_$]*$/i;

export type AssertEventNamesOptions = {
    allowDollar?: boolean;
};

export const isJsIdentifierEventName = (name: string): boolean => {
    return JS_IDENTIFIER.test(name);
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

        if (!isJsIdentifierEventName(name)) {
            throw new Error(
                `Invalid event name. Event names must be formatted as valid JavaScript variable names: "${name}"`,
            );
        }
    }
};
