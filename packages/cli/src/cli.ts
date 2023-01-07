import { Command } from "commander";
import { oneLine } from "common-tags";
import inquirer from "inquirer";
import { DEFAULT_APP_NAME, PLUV_APP } from "./constants";
import { logger, validateAppName } from "./utils";

interface CliFlags {
    noGit: boolean;
    noInstall: boolean;
}

interface CliResults {
    appName: string;
    flags: CliFlags;
}

const defaultOptions: CliResults = {
    appName: DEFAULT_APP_NAME,
    flags: {
        noGit: false,
        noInstall: false,
    },
};

const promptAppName = async (): Promise<string> => {
    const { appName } = await inquirer.prompt<Pick<CliResults, "appName">>({
        name: "appName",
        type: "input",
        message: "What will your project be called?",
        default: defaultOptions.appName,
        validate: validateAppName,
        transformer: (input: string) => {
            return input.trim();
        },
    });

    return appName;
};

export const runCli = async (): Promise<CliResults> => {
    const cliResults: CliResults = {
        ...defaultOptions,
    };

    const program = new Command()
        .name(PLUV_APP)
        .description("A CLI for creating a real-time application with @pluv/io")
        .argument(
            "[dir]",
            "The name of the application, as well as the name of the directory to create"
        )
        .option(
            "--noGit",
            "Explicitly tell the CLI to not initialize a new git repo in the project",
            false
        )
        .option(
            "--noInstall",
            "Explicitly tell the CLI to not run the package manager's install command",
            false
        )
        .parse(process.argv);

    // FIXME: TEMPORARY WARNING WHEN USING YARN 3. SEE ISSUE #57
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    if (process.env.npm_config_user_agent?.startsWith("yarn/3")) {
        logger.warn(oneLine`
            WARNING: It looks like you are using Yarn 3. This is currently not supported,
            and likely to result in a crash. Please run pluv with another
            package manager such as pnpm, npm, or Yarn Classic.
        `);
    }

    // Needs to be separated outside the if statement to correctly infer the type as string | undefined
    const cliProvidedName = program.args[0];

    cliResults.appName = cliProvidedName || (await promptAppName());
    cliResults.flags = program.opts();

    return cliResults;
};
