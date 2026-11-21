import { Option } from "effect";
import { Command, Flag } from "effect/cli";
import { writeLogEvent } from "../../log/event";
import { runBuildCommand, BuildScreen } from "./BuildScreen";
import { done } from "../shared/done";
import { entryArgument } from "../shared/entryArgument";
import { launch } from "../shared/launch";
import { run } from "../shared/run";

export const build = Command.make(
    "build",
    {
        entry: entryArgument(),
        noTypecheck: Flag.Boolean("no-typecheck").pipe(
            Flag.withDescription("Skip the TypeScript check and bundle anyway."),
            Flag.withDefault(false),
            Flag.withoutNegation,
        ),
    },
    ({ entry, noTypecheck }) => {
        return run(() => {
            return launch({
                entry: Option.getOrUndefined(entry),
                noTypecheck,
                mode: "alternate-screen",
                headless: async (config) => {
                    const result = await runBuildCommand(config, writeLogEvent);

                    process.stderr.write(`${result.timings}\n`);
                    process.stdout.write(`${result.artifact}\n`);
                    process.exit(0);
                },
                screen: ({ config, warning }) => {
                    return <BuildScreen config={config} done={done} warning={warning} />;
                },
            });
        });
    },
).pipe(Command.withDescription("Typecheck and bundle the io server for a hosted platform."));
