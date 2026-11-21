import { internalProcedures } from "../client/router/internal";
import type { Organization } from "../schemas";
import { resolveServiceUrls } from "../config/serviceUrls";
import { serviceKey } from "./serviceKey";
import { usePagedList, type PagedList } from "./usePagedList";
import { PAGE_SIZE } from "./usePagedList/page";

export type { Organization };

/** Organizations the saved login can deploy to. */
export const useOrganizations = (params: {
    cwd: string;
    enabled: boolean;
}): PagedList<Organization> => {
    const urls = resolveServiceUrls();

    return usePagedList({
        enabled: params.enabled,
        fallback: "Could not load organizations.",
        procedure: internalProcedures.listOrganizations,
        queryKey: ["deploy", "organizations", params.cwd, ...serviceKey(urls)],
        search: (skip) => ({ skip, take: PAGE_SIZE }),
    });
};
