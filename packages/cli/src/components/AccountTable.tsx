import { TextTableRenderable, bold, type TextChunk } from "@opentui/core";
import { extend } from "@opentui/react";

declare module "@opentui/react" {
    interface OpenTUIComponents {
        "text-table": typeof TextTableRenderable;
    }
}

extend({ "text-table": TextTableRenderable });

const cell = (text: string): TextChunk[] => [{ __isChunk: true, text }];

/** The account row. React has no table element; this registers Core's text table. */
export const AccountTable = ({ id, name }: { id: string; name: string }) => {
    return (
        <text-table
            border
            borderStyle="rounded"
            columnWidthMode="content"
            content={[
                [[bold("Account Name")], [bold("Account ID")]],
                [cell(name), cell(id)],
            ]}
        />
    );
};
