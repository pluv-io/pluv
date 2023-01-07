import fs from "fs-extra";
import path from "path";
import type { PackageJson } from "type-fest";
import { runCli } from "./cli";
import {
    createProject,
    initializeGit,
    installDependencies,
    logNextSteps,
} from "./helpers";
import { logger, parseNameAndPath, renderTitle } from "./utils";

const main = async () => {
    renderTitle();

    const {
        appName,
        flags: { noGit, noInstall },
    } = await runCli();

    // e.g. dir/@mono/app returns ["@mono/app", "dir/app"]
    const [scopedAppName, appDir] = parseNameAndPath(appName);

    const projectDir = await createProject({
        projectName: appDir,
        noInstall,
    });

    if (!noInstall) await installDependencies({ projectDir });

    logNextSteps({ projectName: appDir, noInstall });

    const pkgJson = fs.readJSONSync(
        path.join(projectDir, "package.json")
    ) as PackageJson;

    pkgJson.name = scopedAppName;

    fs.writeJSONSync(path.join(projectDir, "package.json"), pkgJson, {
        spaces: 2,
    });

    if (!noGit) {
        await initializeGit(projectDir);
    }

    process.exit(0);
};

main().catch((err) => {
    logger.error("Aborting installzation...");

    if (err instanceof Error) {
        logger.error(err);
    } else {
        logger.error(
            "An unknown error has occurred. Please open an issue on github with the below:"
        );

        console.log(err);
    }

    process.exit(1);
});
