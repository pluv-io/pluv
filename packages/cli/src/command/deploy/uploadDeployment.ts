import { gzipSync } from "node:zlib";
import { z } from "zod";
import { api } from "../session/api";
import type { ServiceUrls } from "../session/endpoints";

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
    cwd: string;
    urls?: ServiceUrls;
}): Promise<{ id: string; status: string }> => {
    const created = await api
        .client({ cwd: params.cwd, urls: params.urls })
        .post(
            `/api/organizations/${encodeURIComponent(params.organization)}/projects/${encodeURIComponent(params.project)}/deployments/upload`,
        )
        .output(ZodCreatedUpload)
        .error((status, body) => failureMessage(status, body, "Could not start the deployment."))
        .invalid("Could not start the deployment.")
        .send();

    const compressed = gzipSync(params.module);
    const bytes = new ArrayBuffer(compressed.byteLength);

    new Uint8Array(bytes).set(compressed);

    const uploaded = await fetch(created.uploadUrl, {
        method: "PUT",
        headers: {
            "content-encoding": "gzip",
            "content-type": "text/javascript",
        },
        body: bytes,
    });

    if (!uploaded.ok) throw new Error("The module upload failed.");

    return await api
        .client({ cwd: params.cwd, urls: params.urls })
        .post(
            `/api/organizations/${encodeURIComponent(params.organization)}/projects/${encodeURIComponent(params.project)}/deployments/upload/${encodeURIComponent(created.deployment.id)}`,
        )
        .output(ZodCompletedUpload)
        .error((status, body) => failureMessage(status, body, "Could not finish the deployment."))
        .invalid("Could not finish the deployment.")
        .send();
};
