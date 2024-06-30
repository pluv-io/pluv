import { useRerender } from "@pluv-internal/react-hooks";
import { ChevronRightIcon, ChevronsRightIcon } from "@pluv-internal/react-icons";
import type { Maybe } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import type { Table } from "@tanstack/react-table";
import { Button } from "../../../either/atoms/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/Select";

export interface DataTablePaginationProps<TData extends unknown> {
    className?: string;
    table?: Maybe<Table<TData>>;
}

export const DataTablePagination = <TData extends unknown>({ className, table }: DataTablePaginationProps<TData>) => {
    const rerender = useRerender();

    if (!table) return null;

    return (
        <div className={cn("flex items-center justify-between px-2", className)}>
            <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
                selected.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                            rerender();
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden size-8 p-0 lg:flex"
                        onClick={() => {
                            table.setPageIndex(0);
                            rerender();
                        }}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsRightIcon className="size-4 rotate-180" />
                    </Button>
                    <Button
                        variant="outline"
                        className="size-8 p-0"
                        onClick={() => {
                            table.previousPage();
                            rerender();
                        }}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronRightIcon className="size-4 rotate-180" />
                    </Button>
                    <Button
                        variant="outline"
                        className="size-8 p-0"
                        onClick={() => {
                            table.nextPage();
                            rerender();
                        }}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRightIcon className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden size-8 p-0 lg:flex"
                        onClick={() => {
                            table.setPageIndex(table.getPageCount() - 1);
                            rerender();
                        }}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRightIcon className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
