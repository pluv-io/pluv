import type { PluvConfig } from "../../schemas";
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

export const missingDeployTargetMessage = (
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

/** Organization and project from flags, then env, then config. */
export const deployTarget = (params: {
    config: PluvConfig;
    flags: DeployFlags;
}): { organization?: string; project?: string } => {
    return {
        organization:
            params.flags.org ?? fromEnv("PLUV_ORGANIZATION") ?? params.config.organization,
        project: params.flags.project ?? fromEnv("PLUV_PROJECT") ?? params.config.project,
    };
};

/** Save the chosen target when asked, upload the module, and return the status lines. */
export const completeDeploy = async (params: {
    module: Uint8Array;
    cwd: string;
    organization: string;
    project: string;
    save: boolean;
}): Promise<string> => {
    const lines: string[] = [];

    if (params.save) {
        const saved = await writeProjectTarget(params.cwd, {
            organization: params.organization,
            project: params.project,
        });

        if (!saved.wrote && saved.hint) {
            lines.push(saved.hint);
        }
    }

    const deployment = await uploadDeployment({
        module: params.module,
        organization: params.organization,
        project: params.project,
    });

    lines.push(`deployment  ${deployment.id}`);
    lines.push(`status      ${deployment.status}`);

    return lines.join("\n");
};
