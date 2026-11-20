import { Option } from "effect";
import { Command, Flag } from "effect/cli";
import { startDev, DevScreen } from "./DevScreen";
import { done } from "../shared/done";
import { entryArgument } from "../shared/entryArgument";
import { launch } from "../shared/launch";
import { run } from "../shared/run";

export const dev = Command.make(
    "dev",
    {
        entry: entryArgument(),
        port: Flag.Int("port").pipe(
            Flag.withDescription("Listen port. Default 8787."),
            Flag.filter(
                (value) => value >= 1 && value <= 65535,
                () => "Listen port must be an integer from 1 to 65535.",
            ),
            Flag.optional,
        ),
    },
    ({ entry, port }) => {
        return run(() => {
            return launch({
                entry: Option.getOrUndefined(entry),
                port: Option.getOrUndefined(port),
                mode: "split-footer",
                headless: (config) => {
                    return new Promise(() => {
                        startDev(config, {
                            onExit: (code) => {
                                process.exit(code);
                            },
                            onLog: (text) => {
                                process.stderr.write(text);
                            },
                            onStatus: () => {},
                            pipe: false,
                        });
                    });
                },
                screen: ({ config, warning }) => {
                    return <DevScreen config={config} done={done} warning={warning} />;
                },
            });
        });
    },
).pipe(Command.withDescription("Run a local room server."));
