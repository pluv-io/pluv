export const PAGE_SIZE = 50;

export type DeployPage<TItem> = {
    items: TItem[];
    pageInfo: { hasNextPage: boolean };
};

/** The next `skip`, or `undefined` when the list is finished. */
export const nextSkip = <TItem>(page: DeployPage<TItem>, skip: number): number | undefined => {
    if (!page.pageInfo.hasNextPage || page.items.length === 0) return undefined;

    return skip + page.items.length;
};
