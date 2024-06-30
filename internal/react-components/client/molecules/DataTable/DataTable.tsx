import type {
    ColumnDef,
    ColumnFiltersState,
    Table as ReactTable,
    SortingState,
    VisibilityState,
} from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ForwardedRef, ReactElement, forwardRef, useImperativeHandle, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../either/atoms/Table";
import { DataTablePagination } from "./DataTablePagination";
import { cn } from "@pluv-internal/utils";

export interface DataTableProps<TData extends unknown, TValue extends unknown> {
    className?: string;
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    ref?: ForwardedRef<ReactTable<TData>>;
}

export type DataTableType = (<TData, TValue = any>(props: DataTableProps<TData, TValue>) => ReactElement) & {
    displayName?: string;
};

export const DataTable = forwardRef(
    <TData, TValue = any>(props: DataTableProps<TData, TValue>, ref: ForwardedRef<ReactTable<TData>>) => {
        const { className, columns, data } = props;

        const [rowSelection, setRowSelection] = useState({});
        const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
        const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
        const [sorting, setSorting] = useState<SortingState>([]);

        const table = useReactTable({
            data,
            columns,
            state: {
                sorting,
                columnVisibility,
                rowSelection,
                columnFilters,
            },
            enableRowSelection: true,
            onRowSelectionChange: setRowSelection,
            onSortingChange: setSorting,
            onColumnFiltersChange: setColumnFilters,
            onColumnVisibilityChange: setColumnVisibility,
            getCoreRowModel: getCoreRowModel(),
            getFilteredRowModel: getFilteredRowModel(),
            getPaginationRowModel: getPaginationRowModel(),
            getSortedRowModel: getSortedRowModel(),
            getFacetedRowModel: getFacetedRowModel(),
            getFacetedUniqueValues: getFacetedUniqueValues(),
        });

        useImperativeHandle(ref, () => table, [table]);

        return (
            <Table className={cn("rounded-md border", className)}>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} colSpan={header.colSpan}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        );
    },
) as DataTableType;

DataTable.displayName = "DataTable";
