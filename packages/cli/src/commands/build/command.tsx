import { Option } from "effect";
import { Command } from "effect/cli";
import { exitWith } from "../../lib/exit";
import { runBuildCommand, BuildScreen } from "./BuildScreen";
import { done } from "../shared/done";
import { entryArgument } from "../shared/entryArgument";
import { launch } from "../shared/launch";
import { run } from "../shared/run";

export const build = Command.make("build", { entry: entryArgument() }, ({ entry }) => {
    return run(() => {
        return launch({
            entry: Option.getOrUndefined(entry),
            mode: "alternate-screen",
            headless: async (config) => {
                exitWith(await runBuildCommand(config), 0);
            },
            screen: ({ config, warning }) => {
                return <BuildScreen config={config} done={done} warning={warning} />;
            },
        });
    });
}).pipe(Command.withDescription("Bundle the io server for a hosted platform."));
