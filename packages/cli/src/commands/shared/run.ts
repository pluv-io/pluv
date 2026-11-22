import { Effect } from "effect";
import { CliError } from "effect/cli";
export const run = (action: () => Promise<void>) => {
    return Effect.tryPromise({
        try: action,
        catch: (cause) => {
            return new CliError.UserError({
                cause,
                userMessage: cause instanceof Error ? cause.message : "pluv failed.",
            });
        },
    });
};
