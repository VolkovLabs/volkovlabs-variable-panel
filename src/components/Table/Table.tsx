import React, { Fragment, RefObject, useState } from 'react';
import { cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  TableOptions,
  useReactTable,
} from '@tanstack/react-table';
import { TestIds } from '../../constants';
import { Filter } from './Filter';
import { Styles } from './styles';

/**
 * Props
 */
interface Props<TableData extends object> {
  /**
   * Table's columns definition. Must be memoized.
   */
  columns: Array<ColumnDef<TableData>>;

  /**
   * The data to display in the table. Must be memoized.
   */
  data: TableData[];

  /**
   * Class Name
   */
  className?: string;

  /**
   * Get Sub Rows
   */
  getSubRows?: TableOptions<TableData>['getSubRows'];

  /**
   * Show Header Cells
   */
  showHeader?: boolean;

  /**
   * First Selected Row Ref
   */
  firstSelectedRowRef?: RefObject<HTMLTableRowElement>;

  /**
   * Table Ref
   */
  tableRef?: RefObject<HTMLTableElement>;

  /**
   * Table Header Ref
   */
  tableHeaderRef: RefObject<HTMLTableSectionElement>;

  /**
   * Top Offset
   */
  topOffset?: number;
}

/**
 * Table Component
 * @param props
 */
export const Table = <TableData extends object>({
  data,
  className,
  columns,
  getSubRows,
  showHeader = true,
  firstSelectedRowRef,
  tableRef,
  topOffset = 0,
  tableHeaderRef,
}: Props<TableData>) => {
  const styles = useStyles2(Styles);

  /**
   * States
   */
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  /**
   * Instance
   */
  const tableInstance = useReactTable<TableData>({
    columns,
    data,
    autoResetExpanded: false,
    enableSorting: false,
    enableMultiSort: false,
    getSubRows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    enableExpanding: true,
    onExpandedChange: setExpanded,
    initialState: {
      expanded: true,
    },
    state: {
      expanded,
      columnFilters,
    },
  });

  let isSelectedRowFound = false;

  return (
    <table className={cx(styles.table, className)} ref={tableRef}>
      {showHeader && (
        <thead
          data-testid={TestIds.table.header}
          className={styles.header}
          style={{ top: topOffset }}
          ref={tableHeaderRef}
        >
          {tableInstance.getHeaderGroups().map((headerGroup) => {
            return (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className={cx(styles.headerCell, {
                        [styles.disableGrow]: !header.column.getCanResize(),
                        [styles.sortableHeader]: header.column.getCanSort(),
                      })}
                      colSpan={header.colSpan}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanFilter() && <Filter column={header.column} />}
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
      )}

      <tbody>
        {tableInstance.getRowModel().rows.map((row) => {
          const selected = (row.original as any).selected;
          let ref = undefined;
          if (selected && !isSelectedRowFound) {
            isSelectedRowFound = true;
            ref = firstSelectedRowRef;
          }
          return (
            <Fragment key={row.id}>
              <tr className={cx(styles.row, row.getIsExpanded() && styles.expandedRow)} ref={ref}>
                {row.getVisibleCells().map((cell) => {
                  return <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>;
                })}
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
};
