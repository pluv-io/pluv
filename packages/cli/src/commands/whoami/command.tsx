import { Command } from "effect/cli";
import { exit } from "../../lib/exit";
import { runWhoamiCommand, WhoamiScreen } from "./WhoamiScreen";
import { launch } from "../shared/launch";
import { run } from "../shared/run";

export const whoami = Command.make("whoami", {}, () => {
    return run(() => {
        return launch({
            mode: "main-screen",
            headless: async (config) => {
                exit({ code: 0, stderr: await runWhoamiCommand() });
            },
            screen: ({ config, warning }) => {
                return <WhoamiScreen config={config} warning={warning} />;
            },
        });
    });
}).pipe(Command.withDescription("Show the account for the saved session."));
