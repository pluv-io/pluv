import { Effect } from "effect";
import { CliError } from "effect/cli";
import { errorText } from "../../lib/exit";

export const run = (action: () => Promise<void>) => {
    return Effect.tryPromise({
        try: action,
        catch: (cause) => {
            return new CliError.UserError({
                cause,
                userMessage: errorText(cause, "pluv failed."),
            });
        },
    });
};
