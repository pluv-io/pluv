export type Throttle = {
    cancel: () => void;
    schedule: () => Promise<void>;
};

export const throttle = (fn: () => void | Promise<void>, options: { wait: number }): Throttle => {
    const { wait } = options;

    let lastInvokeMs = Number.NEGATIVE_INFINITY;
    let pending = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = async (): Promise<void> => {
        lastInvokeMs = Date.now();
        pending = false;
        await fn();
    };

    const schedule = async (): Promise<void> => {
        const remaining = wait - (Date.now() - lastInvokeMs);

        if (remaining <= 0 && !timer) {
            await flush();
            return;
        }

        pending = true;

        if (timer) return;

        timer = setTimeout(() => {
            timer = null;

            if (!pending) return;

            pending = false;
            void flush();
        }, Math.max(0, remaining));
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
