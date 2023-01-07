export const waitMs = (delayMs: number): Promise<void> => {
    return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
};
