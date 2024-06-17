import { Table as BaseTable } from "./Table";
import { TableBody } from "./TableBody";
import { TableCaption } from "./TableCaption";
import { TableCell } from "./TableCell";
import { TableFooter } from "./TableFooter";
import { TableHead } from "./TableHead";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";

export type { TableProps } from "./Table";
export type { TableBodyProps } from "./TableBody";
export type { TableCaptionProps } from "./TableCaption";
export type { TableCellProps } from "./TableCell";
export type { TableFooterProps } from "./TableFooter";
export type { TableHeadProps } from "./TableHead";
export type { TableHeaderProps } from "./TableHeader";
export type { TableRowProps } from "./TableRow";

export { TableBody } from "./TableBody";
export { TableCaption } from "./TableCaption";
export { TableCell } from "./TableCell";
export { TableFooter } from "./TableFooter";
export { TableHead } from "./TableHead";
export { TableHeader } from "./TableHeader";
export { TableRow } from "./TableRow";

export const Table = Object.assign(BaseTable, {
    Body: TableBody,
    Caption: TableCaption,
    Cell: TableCell,
    Footer: TableFooter,
    Head: TableHead,
    Header: TableHeader,
    Row: TableRow,
});
