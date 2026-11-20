import type { SelectOption } from "@opentui/core";
import { Status } from "./Status";

/** A titled select. Shows a spinner until the list has finished loading. */
export const ChoiceList = <TItem,>({
    description,
    list,
    loading,
    name,
    title,
    value,
    onSelect,
}: {
    description: (item: TItem) => string;
    list: { finished: boolean; items: readonly TItem[] };
    loading: string;
    name: (item: TItem) => string;
    title: string;
    value: (item: TItem) => string;
    onSelect: (value: string) => void;
}) => {
    if (!list.finished || list.items.length === 0) return <Status label={loading} />;

    const options: SelectOption[] = list.items.map((item) => ({
        description: description(item),
        name: name(item),
        value: value(item),
    }));

    return (
        <box style={{ flexDirection: "column" }}>
            <text>{title}</text>
            <select
                focused
                options={options}
                showScrollIndicator
                style={{ height: Math.min(16, options.length * 2) }}
                onSelect={(_index, option) => {
                    if (typeof option?.value === "string") onSelect(option.value);
                }}
            />
        </box>
    );
};
