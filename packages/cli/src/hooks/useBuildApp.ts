import { useApp } from "ink";
import { useState } from "react";
import { BuildAppOptions, buildApp } from "../utils/buildApp.js";
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
