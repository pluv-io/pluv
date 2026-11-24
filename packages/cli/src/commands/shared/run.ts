import { Effect } from "effect";
import { CliError } from "effect/cli";
import { loadDotenv } from "../../config/loadDotenv";

export const run = (action: () => Promise<void>) => {
    return Effect.tryPromise({
        try: () => {
            loadDotenv(process.cwd());

            return action();
        },
        catch: (cause) => {
            return new CliError.UserError({
                cause,
                userMessage: cause instanceof Error ? cause.message : "pluv failed.",
            });
        },
    });
};
