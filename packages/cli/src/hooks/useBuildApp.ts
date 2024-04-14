import { useApp } from "ink";
import { useState } from "react";
import type { BuildAppOptions } from "../utils/index.js";
import { buildApp } from "../utils/index.js";
import { useMountEffect } from "./useMountEffect.js";

export const useBuildApp = (options: BuildAppOptions) => {
    const { exit } = useApp();

    const [error, setError] = useState<Error | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useMountEffect(() => {
        setError(undefined);
        setIsLoading(true);

        buildApp(options)
            .catch((error) => {
                setError(error);
            })
            .finally(() => {
                setIsLoading(false);

                exit();
            });
    });

    return { error, isLoading };
};
