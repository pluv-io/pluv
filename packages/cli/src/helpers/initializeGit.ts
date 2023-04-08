import colors from "kleur";
import { execSync } from "child_process";
import { execa } from "execa";
import fs from "fs-extra";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";
import { logger } from "../utils/logger";

const isGitInstalled = (dir: string): boolean => {
    try {
        execSync("git --version", { cwd: dir });
        return true;
    } catch (_e) {
        return false;
    }
};

/** If dir has `.git` => is the root of a git repo */
const isRootGitRepo = (dir: string): boolean => {
    return fs.existsSync(path.join(dir, ".git"));
};

/** If dir is inside a git worktree, meaning a parent directory has `.git` */
const isInsideGitRepo = async (dir: string): Promise<boolean> => {
    try {
        // If this command succeeds, we're inside a git repo
        await execa("git", ["rev-parse", "--is-inside-work-tree"], {
            cwd: dir,
            stdout: "ignore",
        });
        return true;
    } catch (_e) {
        // Else, it will throw a git-error and we return false
        return false;
    }
};

const getGitVersion = () => {
    const stdout = execSync("git --version").toString().trim();
    const gitVersionTag = stdout.split(" ")[2];
    const major = gitVersionTag?.split(".")[0];
    const minor = gitVersionTag?.split(".")[1];
    return { major: Number(major), minor: Number(minor) };
};

/** If git config value 'init.defaultBranch' is set return value else 'main' */
const getDefaultBranch = () => {
    const stdout = execSync(
        "git config --global init.defaultBranch || echo main"
    )
        .toString()
        .trim();

    return stdout;
};

// This initializes the Git-repository for the project
export const initializeGit = async (projectDir: string) => {
    logger.info("Initializing Git...");

    if (!isGitInstalled(projectDir)) {
        logger.warn("Git is not installed. Skipping Git initialization.");
        return;
    }

    const spinner = ora("Creating a new git repo...\n").start();

    const isRoot = isRootGitRepo(projectDir);
    const isInside = await isInsideGitRepo(projectDir);
    const dirName = path.parse(projectDir).name; // skip full path for logging

    if (isInside && isRoot) {
        // Dir is a root git repo
        spinner.stop();
        const { overwriteGit } = await inquirer.prompt<{
            overwriteGit: boolean;
        }>({
            name: "overwriteGit",
            type: "confirm",
            message: `${colors
                .red()
                .bold(
                    "Warning:"
                )} Git is already initialized in "${dirName}". Initializing a new git repository would delete the previous history. Would you like to continue anyways?`,
            default: false,
        });
        if (!overwriteGit) {
            spinner.info("Skipping Git initialization.");
            return;
        }
        // Deleting the .git folder
        fs.removeSync(path.join(projectDir, ".git"));
    } else if (isInside && !isRoot) {
        // Dir is inside a git worktree
        spinner.stop();
        const { initializeChildGitRepo } = await inquirer.prompt<{
            initializeChildGitRepo: boolean;
        }>({
            name: "initializeChildGitRepo",
            type: "confirm",
            message: `${colors
                .red()
                .bold(
                    "Warning:"
                )} "${dirName}" is already in a git worktree. Would you still like to initialize a new git repository in this directory?`,
            default: false,
        });
        if (!initializeChildGitRepo) {
            spinner.info("Skipping Git initialization.");
            return;
        }
    }

    // We're good to go, initializing the git repo
    try {
        const branchName = getDefaultBranch();

        // --initial-branch flag was added in git v2.28.0
        const { major, minor } = getGitVersion();
        if (major < 2 || minor < 28) {
            await execa("git", ["init"], { cwd: projectDir });
            await execa("git", ["branch", "-m", branchName], {
                cwd: projectDir,
            });
        } else {
            await execa("git", ["init", `--initial-branch=${branchName}`], {
                cwd: projectDir,
            });
        }
        await execa("git", ["add", "."], { cwd: projectDir });
        spinner.succeed(
            `${colors.green("Successfully initialized and staged")} ${colors
                .green()
                .bold("git")}\n`
        );
    } catch (error) {
        // Safeguard, should be unreachable
        spinner.fail(
            `${colors
                .red()
                .bold(
                    "Failed:"
                )} could not initialize git. Update git to the latest version!\n`
        );
    }
};
