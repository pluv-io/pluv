import { Command } from "effect/cli";
import { exitWith } from "../../lib/exit";
import { runLogoutCommand, LogoutScreen } from "./LogoutScreen";
import { done } from "../shared/done";
import { launch } from "../shared/launch";
import { run } from "../shared/run";

export const logout = Command.make("logout", {}, () => {
    return run(() => {
        return launch({
            mode: "alternate-screen",
            headless: async (config) => {
                exitWith(await runLogoutCommand(), 0);
            },
            screen: ({ config, warning }) => {
                return <LogoutScreen config={config} done={done} warning={warning} />;
            },
        });
    });
}).pipe(Command.withDescription("Delete the saved CLI session."));
