import { Command } from "effect/cli";
import { exit } from "../../lib/exit";
import { runLogoutCommand, LogoutScreen } from "./LogoutScreen";
import { launch } from "../shared/launch";
import { run } from "../shared/run";

export const logout = Command.make("logout", {}, () => {
    return run(() => {
        return launch({
            mode: "main-screen",
            headless: async (config) => {
                exit({ code: 0, stderr: await runLogoutCommand() });
            },
            screen: ({ config, warning }) => {
                return <LogoutScreen config={config} warning={warning} />;
            },
        });
    });
}).pipe(Command.withDescription("Delete the saved CLI session."));
