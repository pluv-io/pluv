import { Option } from "effect";
import { Command, Flag } from "effect/cli";
import { exit } from "../../lib/exit";
import { runDeployCommand, DeployScreen } from "./DeployScreen";
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
                mode: "main-screen",
                headless: async (config) => {
                    exit({ code: 0, stderr: await runDeployCommand(config, flags) });
                },
                screen: ({ config, warning }) => {
                    return <DeployScreen config={config} flags={flags} warning={warning} />;
                },
            });
        });
    },
).pipe(Command.withDescription("Upload the built module and make it the active deployment."));
