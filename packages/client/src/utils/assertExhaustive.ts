export const assertExhaustive = (value: never): never => {
    // oxlint-disable-next-line typescript/restrict-template-expressions
    throw new Error(`Unhandled value: ${value}`);
};
