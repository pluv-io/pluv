import { Command } from "effect/cli";
import { exit } from "../../lib/exit";
import { writeLogEvent } from "../../log/event";
import { runLoginCommand, LoginScreen } from "./LoginScreen";
import { runWhoamiCommand } from "../whoami/WhoamiScreen";
import { launch } from "../shared/launch";
import { run } from "../shared/run";

export const login = Command.make("login", {}, () => {
    return run(() => {
        return launch({
            mode: "main-screen",
            headless: async (config) => {
                await runLoginCommand(config, writeLogEvent);
                exit({ code: 0, stderr: await runWhoamiCommand() });
            },
            screen: ({ config, warning }) => {
                return <LoginScreen config={config} warning={warning} />;
            },
        });
    });
}).pipe(Command.withDescription("Log in and save a 24-hour session."));
