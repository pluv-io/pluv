export type Throttle = {
    cancel: () => void;
    schedule: () => void;
};

export const throttle = (fn: () => void | Promise<void>, options: { wait: number }): Throttle => {
    const { wait } = options;

    let lastInvokeMs = Number.NEGATIVE_INFINITY;
    let pending = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = (): void => {
        lastInvokeMs = Date.now();
        pending = false;
        void fn();
    };

    const schedule = (): void => {
        pending = true;

        if (timer) return;

        const remaining = wait - (Date.now() - lastInvokeMs);

        timer = setTimeout(
            () => {
                timer = null;

                if (!pending) return;

                flush();
            },
            remaining <= 0 ? 0 : remaining,
        );
    };

    const cancel = (): void => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        pending = false;
    };

    return { cancel, schedule };
};
