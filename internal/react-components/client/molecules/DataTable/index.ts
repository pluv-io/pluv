import { DataTable as BaseDataTable } from "./DataTable";
import { DataTableColumnHeader } from "./DataTableColumnHeader";
import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableViewOptions } from "./DataTableViewOptions";

export { DataTableColumnHeader } from "./DataTableColumnHeader";
export { DataTableFacetedFilter } from "./DataTableFacetedFilter";
export { DataTablePagination } from "./DataTablePagination";
export { DataTableViewOptions } from "./DataTableViewOptions";

export const DataTable = Object.assign(BaseDataTable, {
    ColumnHeader: DataTableColumnHeader,
    FacetedFilter: DataTableFacetedFilter,
    Pagination: DataTablePagination,
    ViewOptions: DataTableViewOptions,
});
