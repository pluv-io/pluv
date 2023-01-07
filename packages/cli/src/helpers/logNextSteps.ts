import type { InstallerOptions } from "./scaffoldProject";
import { DEFAULT_APP_NAME } from "../constants";
import { getUserPkgManager } from "../utils/getUserPkgManager";
import { logger } from "../utils/logger";

type LogNextStepsOptions = Pick<InstallerOptions, "projectName" | "noInstall">;

// This logs the next steps that the user should take in order to advance the project
export const logNextSteps = (options: LogNextStepsOptions) => {
    const { projectName = DEFAULT_APP_NAME, noInstall } = options;

    const pkgManager = getUserPkgManager();

    logger.info("Next steps:");
    projectName !== "." && logger.info(`  cd ${projectName}`);

    if (noInstall) {
        // To reflect yarn's default behavior of installing packages when no additional args provided
        pkgManager === "yarn"
            ? logger.info(`  ${pkgManager}`)
            : logger.info(`  ${pkgManager} install`);
    }

    logger.info(`  ${pkgManager === "npm" ? "npm run" : pkgManager} dev`);
};
