import chalk from "chalk";
import { execa } from "execa";
import ora from "ora";
import { getUserPkgManager } from "../utils/getUserPkgManager";
import { logger } from "../utils/logger";

type Options = {
    projectDir: string;
};

export const installDependencies = async ({ projectDir }: Options) => {
    logger.info("Installing dependencies...");
    const pkgManager = getUserPkgManager();
    const spinner =
        pkgManager === "yarn"
            ? ora("Running yarn...\n").start()
            : ora(`Running ${pkgManager} install...\n`).start();

    // If the package manager is yarn, use yarn's default behavior to install dependencies
    pkgManager === "yarn"
        ? await execa(pkgManager, [], { cwd: projectDir })
        : await execa(pkgManager, ["install"], { cwd: projectDir });

    spinner.succeed(chalk.green("Successfully installed dependencies!\n"));
};
