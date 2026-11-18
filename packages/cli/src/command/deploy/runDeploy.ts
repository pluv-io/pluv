import type { PluvConfig } from "../../schemas";
import { deploySessionToken } from "./deploySessionToken";
import { readBuiltModule } from "./readBuiltModule";
import { uploadDeployment } from "./uploadDeployment";
import { writeProjectTarget } from "./writeProjectTarget";

export type DeployFlags = {
    org?: string;
    project?: string;
};

const fromEnv = (name: string): string | undefined => {
    const value = process.env[name];

    return value && value.length > 0 ? value : undefined;
};

const missingTargetMessage = (
    organization: string | undefined,
    project: string | undefined,
): string => {
    const flags: string[] = [];
    const env: string[] = [];

    if (!organization) {
        flags.push("--org");
        env.push("PLUV_ORGANIZATION");
    }

    if (!project) {
        flags.push("--project");
        env.push("PLUV_PROJECT");
    }

    return `Pass ${flags.join(" and ")}, or set ${env.join(" and ")}.`;
};

const wantsSave = (answer: string): boolean => /^y(es)?$/i.test(answer.trim());

/** Resolve the project, upload the built module, and print the deployment id and status. */
export const runDeploy = async (params: {
    ask: (label: string) => Promise<string>;
    config: PluvConfig;
    cwd: string;
    distDir: string;
    flags: DeployFlags;
    isTTY: boolean;
}): Promise<string> => {
    const module = await readBuiltModule(params.distDir);
    let organization =
        params.flags.org ?? fromEnv("PLUV_ORGANIZATION") ?? params.config.organization;
    let project = params.flags.project ?? fromEnv("PLUV_PROJECT") ?? params.config.project;

    if (!params.isTTY && (!organization || !project)) {
        throw new Error(missingTargetMessage(organization, project));
    }

    let prompted = false;

    if (!organization) {
        organization = (await params.ask("Organization slug: ")).trim();

        if (!organization) throw new Error("Organization slug is required.");

        prompted = true;
    }

    if (!project) {
        project = (await params.ask("Project slug: ")).trim();

        if (!project) throw new Error("Project slug is required.");

        prompted = true;
    }

    const lines: string[] = [];

    if (prompted) {
        const answer = await params.ask("Save organization and project in the pluv config? [y/N] ");

        if (wantsSave(answer)) {
            const saved = await writeProjectTarget(params.cwd, { organization, project });

            if (!saved.wrote) {
                lines.push(`organization  ${organization}`);
                lines.push(`project       ${project}`);
            }
        }
    }

    const token = await deploySessionToken(params.cwd);
    const deployment = await uploadDeployment({
        module,
        organization,
        project,
        token,
        urls: params.config["~"],
    });

    lines.push(`deployment  ${deployment.id}`);
    lines.push(`status      ${deployment.status}`);

    return lines.join("\n");
};
