import { z } from "zod";
import { apiBase, type ServiceUrls } from "../session/endpoints";
import { exchangeSessionJwt } from "../session/exchangeSessionJwt";
import { requestJson } from "../session/request";

const ZodApiError = z.object({
    message: z.string().min(1),
});

const ZodCreatedUpload = z.object({
    deployment: z.object({
        id: z.string().min(1),
        status: z.string().min(1),
    }),
    uploadUrl: z.string().min(1),
});

const ZodCompletedUpload = z.object({
    id: z.string().min(1),
    status: z.string().min(1),
});

const failureMessage = (status: number, body: unknown, fallback: string): string => {
    if (status === 401) return "The saved login expired. Run pluv login.";

    const parsed = ZodApiError.safeParse(body);

    return parsed.success ? parsed.data.message : fallback;
};

/** Create a pending deployment, PUT the module, and complete the upload. */
export const uploadDeployment = async (params: {
    module: Uint8Array;
    organization: string;
    project: string;
    token: string;
    urls?: ServiceUrls;
}): Promise<{ id: string; status: string }> => {
    const createJwt = await exchangeSessionJwt(params.token, params.urls);
    const createUrl = new URL(
        `/api/organizations/${encodeURIComponent(params.organization)}/projects/${encodeURIComponent(params.project)}/deployments/upload`,
        apiBase(params.urls),
    );
    const created = await requestJson({
        url: createUrl,
        method: "POST",
        token: createJwt,
        schema: ZodCreatedUpload,
        error: (status, body) => failureMessage(status, body, "Could not start the deployment."),
        invalid: "Could not start the deployment.",
    });

    const bytes = new ArrayBuffer(params.module.byteLength);

    new Uint8Array(bytes).set(params.module);

    const uploaded = await fetch(created.uploadUrl, {
        method: "PUT",
        headers: { "content-type": "text/javascript" },
        body: bytes,
    });

    if (!uploaded.ok) throw new Error("The module upload failed.");

    const completeJwt = await exchangeSessionJwt(params.token, params.urls);

    return await requestJson({
        url: new URL(
            `/api/organizations/${encodeURIComponent(params.organization)}/projects/${encodeURIComponent(params.project)}/deployments/upload/${encodeURIComponent(created.deployment.id)}`,
            apiBase(params.urls),
        ),
        method: "POST",
        token: completeJwt,
        schema: ZodCompletedUpload,
        error: (status, body) => failureMessage(status, body, "Could not finish the deployment."),
        invalid: "Could not finish the deployment.",
    });
};
