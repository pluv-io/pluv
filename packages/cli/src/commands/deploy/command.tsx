import { Option } from "effect";
import { Command, Flag } from "effect/cli";
import { exitWith } from "../../lib/exit";
import { runDeployCommand, DeployScreen } from "./DeployScreen";
import { done } from "../shared/done";
import { launch } from "../shared/launch";
import { run } from "../shared/run";

const slugFlag = (name: string, description: string) => {
    return Flag.String(name).pipe(
        Flag.withDescription(description),
        Flag.filter(
            (value) => value.trim().length > 0,
            () => `--${name} needs a value.`,
        ),
        Flag.optional,
    );
};

export const deploy = Command.make(
    "deploy",
    {
        org: slugFlag("org", "Organization slug."),
        project: slugFlag("project", "Project slug."),
    },
    ({ org, project }) => {
        const flags = {
            org: Option.getOrUndefined(org),
            project: Option.getOrUndefined(project),
        };

        return run(() => {
            return launch({
                mode: "alternate-screen",
                headless: async (config) => {
                    exitWith(await runDeployCommand(config, flags), 0);
                },
                screen: ({ config, warning }) => {
                    return (
                        <DeployScreen config={config} done={done} flags={flags} warning={warning} />
                    );
                },
            });
        });
    },
).pipe(Command.withDescription("Upload the built module and make it the active deployment."));
