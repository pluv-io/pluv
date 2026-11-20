import { useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { CliProcedure, RequestError } from "../../client/procedure";
import { nextSkip, type DeployPage } from "./page";

export type PagedList<TItem> = {
    empty: boolean;
    error: Error | null;
    fetchingMore: boolean;
    finished: boolean;
    hasNextPage: boolean;
    items: TItem[];
    loadMore: () => void;
    pending: boolean;
};

/** Load every page of one CLI list before a select is shown. */
export const usePagedList = <TInput, TItem>(params: {
    enabled: boolean;
    fallback: string;
    procedure: CliProcedure<TInput, DeployPage<TItem>>;
    procedureInput?: TInput;
    queryKey: readonly unknown[];
    search: (skip: number) => Record<string, string | number>;
    statusError?: (status: number) => string | undefined;
}): PagedList<TItem> => {
    const query = useInfiniteQuery({
        enabled: params.enabled,
        initialPageParam: 0,
        queryKey: params.queryKey,
        queryFn: ({ pageParam }) => {
            const invokeOptions: {
                searchParams: Record<string, string | number>;
                error?: RequestError;
            } = { searchParams: params.search(pageParam) };

            if (params.statusError) {
                const procedureError = params.procedure.error;

                invokeOptions.error = (status, body) => {
                    const message = params.statusError?.(status);

                    if (message !== undefined) return message;
                    if (typeof procedureError === "function") return procedureError(status, body);

                    return procedureError;
                };
            }

            return params.procedure.invoke(params.procedureInput, invokeOptions);
        },
        getNextPageParam: (lastPage, _pages, skip) => nextSkip(lastPage, skip),
    });
    const { fetchNextPage } = query;
    const items = query.data?.pages.flatMap((page) => page.items) ?? [];
    const finished = query.isSuccess && !query.hasNextPage && !query.isFetching;
    const loadMore = useCallback(() => {
        void fetchNextPage();
    }, [fetchNextPage]);

    return {
        empty: finished && items.length === 0,
        error: query.isError
            ? query.error instanceof Error
                ? query.error
                : new Error(params.fallback)
            : null,
        fetchingMore: query.isFetchingNextPage,
        finished,
        hasNextPage: query.hasNextPage,
        items,
        loadMore,
        pending: query.isPending,
    };
};
