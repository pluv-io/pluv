import path from "path";
import { scaffoldProject } from "./scaffoldProject";
import { getUserPkgManager } from "../utils/getUserPkgManager";

interface CreateProjectOptions {
    projectName: string;
    noInstall: boolean;
}

export const createProject = async (options: CreateProjectOptions) => {
    const { projectName, noInstall } = options;

    const pkgManager = getUserPkgManager();
    const projectDir = path.resolve(process.cwd(), projectName);

    // Bootstraps the base Next.js application
    await scaffoldProject({
        projectName,
        projectDir,
        pkgManager,
        noInstall,
    });

    return projectDir;
};
