import { gzipSync } from "node:zlib";
import { cliRpc } from "../../client/rpc";

/** Create a pending deployment, PUT the module, and complete the upload. */
export const uploadDeployment = async (params: {
    module: Uint8Array;
    organization: string;
    project: string;
}): Promise<{ id: string; status: string }> => {
    const target = { organization: params.organization, project: params.project };

    const created = await cliRpc.internal.createDeploymentUpload(target);

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

    return cliRpc.internal.completeDeploymentUpload({
        ...target,
        deploymentId: created.deployment.id,
    });
};
