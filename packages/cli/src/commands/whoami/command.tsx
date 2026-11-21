import { Command } from "effect/cli";
import { exitWith } from "../../lib/exit";
import { runWhoamiCommand, WhoamiScreen } from "./WhoamiScreen";
import { done } from "../shared/done";
import { launch } from "../shared/launch";
import { run } from "../shared/run";

export const whoami = Command.make("whoami", {}, () => {
    return run(() => {
        return launch({
            mode: "alternate-screen",
            headless: async (config) => {
                exitWith(await runWhoamiCommand(), 0);
            },
            screen: ({ config, warning }) => {
                return <WhoamiScreen config={config} done={done} warning={warning} />;
            },
        });
    });
}).pipe(Command.withDescription("Show the account for the saved session."));
