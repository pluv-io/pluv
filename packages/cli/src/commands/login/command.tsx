import { Command } from "effect/cli";
import { exitWith } from "../../lib/exit";
import { runLoginCommand, LoginScreen } from "./LoginScreen";
import { runWhoamiCommand } from "../whoami/WhoamiScreen";
import { done } from "../shared/done";
import { launch } from "../shared/launch";
import { run } from "../shared/run";

export const login = Command.make("login", {}, () => {
    return run(() => {
        return launch({
            mode: "alternate-screen",
            headless: async (config) => {
                await runLoginCommand(config, (url) => {
                    process.stderr.write(`Open ${url} if the browser does not.\n`);
                });
                exitWith(await runWhoamiCommand(), 0);
            },
            screen: ({ config, warning }) => {
                return <LoginScreen config={config} done={done} warning={warning} />;
            },
        });
    });
}).pipe(Command.withDescription("Log in and save a 24-hour session."));
