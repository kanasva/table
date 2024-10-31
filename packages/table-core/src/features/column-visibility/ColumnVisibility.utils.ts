import {
  table_getCenterVisibleLeafColumns,
  table_getLeftVisibleLeafColumns,
  table_getRightVisibleLeafColumns,
} from '../column-pinning/ColumnPinning.utils'
import type { CellData, RowData, Updater } from '../../types/type-utils'
import type { TableFeatures } from '../../types/TableFeatures'
import type { Table_Internal } from '../../types/Table'
import type { Cell } from '../../types/Cell'
import type { Column } from '../../types/Column'
import type { ColumnPinningPosition } from '../column-pinning/ColumnPinning.types'
import type {
  ColumnDef_ColumnVisibility,
  ColumnVisibilityState,
} from './ColumnVisibility.types'
import type { Row } from '../../types/Row'

export function getDefaultColumnVisibilityState(): ColumnVisibilityState {
  return structuredClone({})
}

export function column_toggleVisibility<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(
  column: Column<TFeatures, TData, TValue> & {
    columnDef: Partial<ColumnDef_ColumnVisibility>
  },
  visible?: boolean,
): void {
  if (column_getCanHide(column)) {
    table_setColumnVisibility(column.table, (old) => ({
      ...old,
      [column.id]: visible ?? !column_getIsVisible(column),
    }))
  }
}

export function column_getIsVisible<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(
  column: Column<TFeatures, TData, TValue> & {
    columnDef: Partial<ColumnDef_ColumnVisibility>
  },
): boolean {
  const childColumns = column.columns
  return (
    (childColumns.length
      ? childColumns.some((c) => column_getIsVisible(c))
      : column.table.options.state?.columnVisibility?.[column.id]) ?? true
  )
}

export function column_getCanHide<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(
  column: Column<TFeatures, TData, TValue> & {
    columnDef: Partial<ColumnDef_ColumnVisibility>
  },
) {
  return (
    (column.columnDef.enableHiding ?? true) &&
    (column.table.options.enableHiding ?? true)
  )
}

export function column_getToggleVisibilityHandler<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(
  column: Column<TFeatures, TData, TValue> & {
    columnDef: Partial<ColumnDef_ColumnVisibility>
  },
) {
  return (e: unknown) => {
    column_toggleVisibility(
      column,
      ((e as MouseEvent).target as HTMLInputElement).checked,
    )
  }
}

export function column_getVisibleLeafColumns<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  table: Table_Internal<TFeatures, TData>,
  position?: ColumnPinningPosition | 'center',
) {
  return !position
    ? table_getVisibleLeafColumns(table)
    : position === 'center'
      ? table_getCenterVisibleLeafColumns(table)
      : position === 'left'
        ? table_getLeftVisibleLeafColumns(table)
        : table_getRightVisibleLeafColumns(table)
}

export function row_getAllVisibleCells<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(row: Row<TFeatures, TData>) {
  return row.getAllCells().filter((cell) => column_getIsVisible(cell.column))
}

export function row_getVisibleCells<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  left: Array<Cell<TFeatures, TData, unknown>>,
  center: Array<Cell<TFeatures, TData, unknown>>,
  right: Array<Cell<TFeatures, TData, unknown>>,
) {
  return [...left, ...center, ...right]
}

export function table_getVisibleFlatColumns<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return table
    .getAllFlatColumns()
    .filter((column) => column_getIsVisible(column))
}

export function table_getVisibleLeafColumns<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return table
    .getAllLeafColumns()
    .filter((column) => column_getIsVisible(column))
}

export function table_setColumnVisibility<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  table: Table_Internal<TFeatures, TData>,
  updater: Updater<ColumnVisibilityState>,
) {
  table.options.onColumnVisibilityChange?.(updater)
}

export function table_resetColumnVisibility<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>, defaultState?: boolean) {
  table_setColumnVisibility(
    table,
    defaultState ? {} : (table.initialState.columnVisibility ?? {}),
  )
}

export function table_toggleAllColumnsVisible<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>, value?: boolean) {
  value = value ?? !table_getIsAllColumnsVisible(table)

  table_setColumnVisibility(
    table,
    table.getAllLeafColumns().reduce(
      (obj, column) => ({
        ...obj,
        [column.id]: !value ? !column_getCanHide(column) : value,
      }),
      {},
    ),
  )
}

export function table_getIsAllColumnsVisible<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return !table
    .getAllLeafColumns()
    .some((column) => !column_getIsVisible(column))
}

export function table_getIsSomeColumnsVisible<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return table.getAllLeafColumns().some((column) => column_getIsVisible(column))
}

export function table_getToggleAllColumnsVisibilityHandler<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return (e: unknown) => {
    table_toggleAllColumnsVisible(
      table,
      ((e as MouseEvent).target as HTMLInputElement).checked,
    )
  }
}
