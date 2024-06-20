import { useRerender } from "@pluv-internal/react-hooks";
import { CheckIcon, PlusCircleIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import type { Column } from "@tanstack/react-table";
import type { ComponentType } from "react";
import { Badge } from "../../../either/atoms/Badge";
import { Button } from "../../../either/atoms/Button";
import { Command } from "../../atoms/Command";
import { Popover } from "../../atoms/Popover";
import { Separator } from "../../atoms/Separator";

export interface DataTableFacetedFilterProps<TData extends unknown, TValue extends unknown> {
    className?: string;
    column?: Column<TData, TValue>;
    title?: string;
    options: {
        label: string;
        value: string;
        icon?: ComponentType<{ className?: string }>;
    }[];
}

export const DataTableFacetedFilter = <TData, TValue>({
    className,
    column,
    title,
    options,
}: DataTableFacetedFilterProps<TData, TValue>) => {
    const rerender = useRerender();

    const facets = column?.getFacetedUniqueValues();
    const selectedValues = new Set(column?.getFilterValue() as string[]);

    return (
        <Popover>
            <Popover.Trigger asChild>
                <Button className={cn("h-8 border-dashed", className)} variant="outline" size="sm">
                    <PlusCircleIcon className="mr-2 size-4" />
                    {title}
                    {selectedValues?.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                        {selectedValues.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selectedValues.has(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-[200px] p-0" align="start">
                <Command>
                    <Command.Input placeholder={title} />
                    <Command.List>
                        <Command.Empty>No results found.</Command.Empty>
                        <Command.Group>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(option.value);

                                return (
                                    <Command.Item
                                        key={option.value}
                                        onSelect={() => {
                                            if (isSelected) {
                                                selectedValues.delete(option.value);
                                            } else {
                                                selectedValues.add(option.value);
                                            }
                                            const filterValues = Array.from(selectedValues);

                                            column?.setFilterValue(filterValues.length ? filterValues : undefined);

                                            setTimeout(() => {
                                                rerender();
                                            }, 0);
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible",
                                            )}
                                        >
                                            <CheckIcon className={cn("size-4")} />
                                        </div>
                                        {option.icon && <option.icon className="mr-2 size-4 text-muted-foreground" />}
                                        <span>{option.label}</span>
                                        {facets?.get(option.value) && (
                                            <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
                                                {facets.get(option.value)}
                                            </span>
                                        )}
                                    </Command.Item>
                                );
                            })}
                        </Command.Group>
                        {selectedValues.size > 0 && (
                            <>
                                <Command.Separator />
                                <Command.Group>
                                    <Command.Item
                                        onSelect={() => {
                                            column?.setFilterValue(undefined);

                                            setTimeout(() => {
                                                rerender();
                                            }, 0);
                                        }}
                                        className="justify-center text-center"
                                    >
                                        Clear filters
                                    </Command.Item>
                                </Command.Group>
                            </>
                        )}
                    </Command.List>
                </Command>
            </Popover.Content>
        </Popover>
    );
};
