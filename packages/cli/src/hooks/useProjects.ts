import { internalProcedures } from "../client/router/internal";
import type { Project } from "../schemas";
import { resolveServiceUrls } from "../config/serviceUrls";
import { serviceKey } from "./serviceKey";
import { usePagedList, type PagedList } from "./usePagedList";
import { PAGE_SIZE } from "./usePagedList/page";

export type { Project };

/** Projects in one organization, ordered by name. */
export const useProjects = (params: {
    cwd: string;
    enabled: boolean;
    organization: string;
}): PagedList<Project> => {
    const urls = resolveServiceUrls();

    return usePagedList({
        enabled: params.enabled,
        fallback: "Could not load projects.",
        procedure: internalProcedures.listProjects,
        procedureInput: { organization: params.organization },
        queryKey: ["deploy", "projects", params.cwd, params.organization, ...serviceKey(urls)],
        search: (skip) => ({ skip, take: PAGE_SIZE, order: "asc", sort: "name" }),
        statusError: (status) => {
            if (status === 404) return `Organization ${params.organization} was not found.`;

            return undefined;
        },
    });
};
