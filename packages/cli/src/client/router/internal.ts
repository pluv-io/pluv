import {
    ZodCompletedUpload,
    ZodCreatedUpload,
    ZodOrganization,
    ZodPage,
    ZodProject,
} from "../../schemas";
import { apiRequestError } from "../apiRequestError";
import { procedure } from "../procedure";

type DeploymentTarget = {
    organization: string;
    project: string;
};

type CompleteUploadTarget = DeploymentTarget & {
    deploymentId: string;
};

const startDeploymentError = apiRequestError("Could not start the deployment.");
const finishDeploymentError = apiRequestError("Could not finish the deployment.");

export const internalProcedures = {
    listOrganizations: procedure()
        .get("/api/internal/cli/organizations")
        .session()
        .output(ZodPage(ZodOrganization))
        .error(apiRequestError("Could not load organizations."))
        .build(),
    listProjects: procedure<{ organization: string }>()
        .get(
            ({ organization }) =>
                `/api/internal/cli/organizations/${organization}/collections/project`,
        )
        .session()
        .output(ZodPage(ZodProject))
        .error(apiRequestError("Could not load projects."))
        .build(),
    createDeploymentUpload: procedure<DeploymentTarget>()
        .post(
            ({ organization, project }) =>
                `/api/internal/cli/organizations/${organization}/projects/${project}/deployments/upload`,
        )
        .session()
        .output(ZodCreatedUpload, { error: startDeploymentError })
        .error(startDeploymentError)
        .build(),
    completeDeploymentUpload: procedure<CompleteUploadTarget>()
        .post(
            ({ organization, project, deploymentId }) =>
                `/api/internal/cli/organizations/${organization}/projects/${project}/deployments/upload/${deploymentId}`,
        )
        .session()
        .output(ZodCompletedUpload, { error: finishDeploymentError })
        .error(finishDeploymentError)
        .build(),
};
