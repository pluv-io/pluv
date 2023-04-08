import path from "path";
import colors from "kleur";
import fs from "fs-extra";
import inquirer from "inquirer";
import ora from "ora";
import { PKG_ROOT } from "../constants";
import type { PackageManager } from "../utils";
import { logger } from "../utils/logger";

export interface InstallerOptions {
    projectDir: string;
    pkgManager: PackageManager;
    noInstall: boolean;
    projectName?: string;
}

// This bootstraps the base Next.js application
export const scaffoldProject = async (options: InstallerOptions) => {
    const { projectName, projectDir, pkgManager, noInstall } = options;

    const srcDir = path.join(PKG_ROOT, "template/base");

    if (!noInstall) {
        logger.info(`\nUsing: ${colors.cyan().bold(pkgManager)}\n`);
    } else {
        logger.info("");
    }

    const spinner = ora(`Scaffolding in: ${projectDir}...\n`).start();

    if (fs.existsSync(projectDir)) {
        if (fs.readdirSync(projectDir).length === 0) {
            spinner.info(
                `${colors
                    .cyan()
                    .bold(
                        projectName ?? ""
                    )} exists but is empty, continuing...\n`
            );
        } else {
            spinner.stopAndPersist();
            const { overwriteDir } = await inquirer.prompt<{
                overwriteDir: "abort" | "clear" | "overwrite";
            }>({
                name: "overwriteDir",
                type: "list",
                message: `${colors.red().bold("Warning:")} ${colors
                    .cyan()
                    .bold(
                        projectName ?? ""
                    )} already exists and isn't empty. How would you like to proceed?`,
                choices: [
                    {
                        name: "Abort installation (recommended)",
                        value: "abort",
                        short: "Abort",
                    },
                    {
                        name: "Clear the directory and continue installation",
                        value: "clear",
                        short: "Clear",
                    },
                    {
                        name: "Continue installation and overwrite conflicting files",
                        value: "overwrite",
                        short: "Overwrite",
                    },
                ],
                default: "abort",
            });
            if (overwriteDir === "abort") {
                spinner.fail("Aborting installation...");
                process.exit(0);
            }

            const overwriteAction =
                overwriteDir === "clear"
                    ? "clear the directory"
                    : "overwrite conflicting files";

            const { confirmOverwriteDir } = await inquirer.prompt<{
                confirmOverwriteDir: boolean;
            }>({
                name: "confirmOverwriteDir",
                type: "confirm",
                message: `Are you sure you want to ${overwriteAction}?`,
                default: false,
            });

            if (!confirmOverwriteDir) {
                spinner.fail("Aborting installation...");
                process.exit(0);
            }

            if (overwriteDir === "clear") {
                spinner.info(
                    `Emptying ${colors
                        .cyan()
                        .bold(projectName ?? "")} and creating t3 app..\n`
                );
                fs.emptyDirSync(projectDir);
            }
        }
    }

    spinner.start();

    fs.copySync(srcDir, projectDir);
    fs.renameSync(
        path.join(projectDir, "_gitignore"),
        path.join(projectDir, ".gitignore")
    );

    const scaffoldedName =
        projectName === "." ? "App" : colors.cyan().bold(projectName ?? "");

    spinner.succeed(
        `${scaffoldedName} ${colors.green("scaffolded successfully!")}\n`
    );
};
