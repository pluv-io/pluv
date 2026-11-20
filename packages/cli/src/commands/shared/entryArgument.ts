import { Argument } from "effect/cli";

/** Optional server module. A fresh argument for each command that accepts one. */
export const entryArgument = () => {
    return Argument.String("entry").pipe(
        Argument.withDescription(
            "Server module. Overrides config entry. Default ./pluv.ts when no config file.",
        ),
        Argument.optional,
    );
};
