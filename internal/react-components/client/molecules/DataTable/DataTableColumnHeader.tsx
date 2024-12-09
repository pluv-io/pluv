import { useRerender } from "@pluv-internal/react-hooks";
import { ArrowDownIcon, ChevronUpDownIcon, EyeOffIcon } from "@pluv-internal/react-icons";
import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import type { Column } from "@tanstack/react-table";
import { Button } from "../../../either/atoms/Button";
import { DropdownMenu } from "../../atoms/DropdownMenu";

export type DataTableColumnHeaderProps<TData, TValue> = ComponentProps<"div"> & {
    column: Column<TData, TValue>;
    title: string;
};

export const DataTableColumnHeader = <TData extends unknown, TValue extends unknown>(
    props: DataTableColumnHeaderProps<TData, TValue>,
) => {
    const { className, column, title } = props;

    const rerender = useRerender();

    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>;
    }

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
                        <span>{title}</span>
                        {column.getIsSorted() === "desc" ? (
                            <ArrowDownIcon className="ml-2 size-4" />
                        ) : column.getIsSorted() === "asc" ? (
                            <ArrowDownIcon className="ml-2 size-4 rotate-180" />
                        ) : (
                            <ChevronUpDownIcon className="ml-2 size-4" />
                        )}
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start">
                    <DropdownMenu.Item
                        onClick={() => {
                            column.toggleSorting(false);

                            setTimeout(() => {
                                rerender();
                            }, 0);
                        }}
                    >
                        <ArrowDownIcon className="mr-2 size-3.5 rotate-180 text-muted-foreground/70" />
                        Asc
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onClick={() => {
                            column.toggleSorting(true);

                            setTimeout(() => {
                                rerender();
                            }, 0);
                        }}
                    >
                        <ArrowDownIcon className="mr-2 size-3.5 text-muted-foreground/70" />
                        Desc
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                        onClick={() => {
                            column.toggleVisibility(false);

                            setTimeout(() => {
                                rerender();
                            }, 0);
                        }}
                    >
                        <EyeOffIcon className="mr-2 size-3.5 text-muted-foreground/70" />
                        Hide
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu>
        </div>
    );
};
