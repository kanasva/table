import {
  column_getIsVisible,
  row_getAllVisibleCells,
  table_getVisibleLeafColumns,
} from '../column-visibility/ColumnVisibility.utils'
import { buildHeaderGroups } from '../../core/headers/buildHeaderGroups'
import type { Row } from '../../types/Row'
import type { CellData, RowData, Updater } from '../../types/type-utils'
import type { TableFeatures } from '../../types/TableFeatures'
import type { Table_Internal } from '../../types/Table'
import type { Column } from '../../types/Column'
import type {
  ColumnDef_ColumnPinning,
  ColumnPinningPosition,
  ColumnPinningState,
} from './ColumnPinning.types'

// State

export function getDefaultColumnPinningState(): ColumnPinningState {
  return structuredClone({
    left: [],
    right: [],
  })
}

// Column APIs

export function column_pin<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(column: Column<TFeatures, TData, TValue>, position: ColumnPinningPosition) {
  const columnIds = column
    .getLeafColumns()
    .map((d) => d.id)
    .filter(Boolean)

  table_setColumnPinning(column.table, (old) => {
    if (position === 'right') {
      return {
        left: old.left.filter((d) => !columnIds.includes(d)),
        right: [
          ...old.right.filter((d) => !columnIds.includes(d)),
          ...columnIds,
        ],
      }
    }

    if (position === 'left') {
      return {
        left: [...old.left.filter((d) => !columnIds.includes(d)), ...columnIds],
        right: old.right.filter((d) => !columnIds.includes(d)),
      }
    }

    return {
      left: old.left.filter((d) => !columnIds.includes(d)),
      right: old.right.filter((d) => !columnIds.includes(d)),
    }
  })
}

export function column_getCanPin<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(
  column: Column<TFeatures, TData, TValue> & {
    columnDef: ColumnDef_ColumnPinning
  },
) {
  const leafColumns = column.getLeafColumns() as Array<
    Column<TFeatures, TData, TValue> & {
      columnDef: ColumnDef_ColumnPinning
    }
  >

  return leafColumns.some(
    (leafColumn) =>
      (leafColumn.columnDef.enablePinning ?? true) &&
      (column.table.options.enableColumnPinning ?? true),
  )
}

export function column_getIsPinned<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(column: Column<TFeatures, TData, TValue>): ColumnPinningPosition | false {
  const leafColumnIds = column.getLeafColumns().map((d) => d.id)

  const { left, right } =
    column.table.options.state?.columnPinning ?? getDefaultColumnPinningState()

  const isLeft = leafColumnIds.some((d) => left.includes(d))
  const isRight = leafColumnIds.some((d) => right.includes(d))

  return isLeft ? 'left' : isRight ? 'right' : false
}

export function column_getPinnedIndex<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(column: Column<TFeatures, TData, TValue>) {
  const position = column_getIsPinned(column)

  return position
    ? (column.table.options.state?.columnPinning?.[position].indexOf(
        column.id,
      ) ?? -1)
    : 0
}

// Row APIs

export function row_getCenterVisibleCells<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(row: Row<TFeatures, TData>) {
  const allCells = row_getAllVisibleCells(row)
  const { left, right } =
    row.table.options.state?.columnPinning ?? getDefaultColumnPinningState()
  const leftAndRight: Array<string> = [...left, ...right]
  return allCells.filter((d) => !leftAndRight.includes(d.column.id))
}

export function row_getLeftVisibleCells<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(row: Row<TFeatures, TData>) {
  const allCells = row_getAllVisibleCells(row)
  const { left } =
    row.table.options.state?.columnPinning ?? getDefaultColumnPinningState()
  const cells = left
    .map((columnId) => allCells.find((cell) => cell.column.id === columnId)!)
    .filter(Boolean)
    .map((d) => ({ ...d, position: 'left' }))

  return cells
}

export function row_getRightVisibleCells<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(row: Row<TFeatures, TData>) {
  const allCells = row_getAllVisibleCells(row)
  const { right } =
    row.table.options.state?.columnPinning ?? getDefaultColumnPinningState()
  const cells = right
    .map((columnId) => allCells.find((cell) => cell.column.id === columnId)!)
    .filter(Boolean)
    .map((d) => ({ ...d, position: 'right' }))

  return cells
}

// Table APIs

export function table_setColumnPinning<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  table: Table_Internal<TFeatures, TData>,
  updater: Updater<ColumnPinningState>,
) {
  table.options.onColumnPinningChange?.(updater)
}

export function table_resetColumnPinning<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>, defaultState?: boolean) {
  table_setColumnPinning(
    table,
    defaultState
      ? getDefaultColumnPinningState()
      : (table.initialState.columnPinning ?? getDefaultColumnPinningState()),
  )
}

export function table_getIsSomeColumnsPinned<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>, position?: ColumnPinningPosition) {
  const pinningState = table.options.state?.columnPinning

  if (!position) {
    return Boolean(pinningState?.left.length || pinningState?.right.length)
  }
  return Boolean(pinningState?.[position].length)
}

// header groups

export function table_getLeftHeaderGroups<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const allColumns = table.getAllColumns()
  const leafColumns = table_getVisibleLeafColumns(table)
  const { left } =
    table.options.state?.columnPinning ?? getDefaultColumnPinningState()

  const orderedLeafColumns = left
    .map((columnId) => leafColumns.find((d) => d.id === columnId)!)
    .filter(Boolean)

  return buildHeaderGroups(allColumns, orderedLeafColumns, table, 'left')
}

export function table_getRightHeaderGroups<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const allColumns = table.getAllColumns()
  const leafColumns = table_getVisibleLeafColumns(table)
  const { right } =
    table.options.state?.columnPinning ?? getDefaultColumnPinningState()

  const orderedLeafColumns = right
    .map((columnId) => leafColumns.find((d) => d.id === columnId)!)
    .filter(Boolean)

  return buildHeaderGroups(allColumns, orderedLeafColumns, table, 'right')
}

export function table_getCenterHeaderGroups<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const allColumns = table.getAllColumns()
  let leafColumns = table_getVisibleLeafColumns(table)
  const { left, right } =
    table.options.state?.columnPinning ?? getDefaultColumnPinningState()
  const leftAndRight: Array<string> = [...left, ...right]

  leafColumns = leafColumns.filter(
    (column) => !leftAndRight.includes(column.id),
  )
  return buildHeaderGroups(allColumns, leafColumns, table, 'center')
}

// footer groups

export function table_getLeftFooterGroups<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const headerGroups = table_getLeftHeaderGroups(table)
  return [...headerGroups].reverse()
}

export function table_getRightFooterGroups<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const headerGroups = table_getRightHeaderGroups(table)
  return [...headerGroups].reverse()
}

export function table_getCenterFooterGroups<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const headerGroups = table_getCenterHeaderGroups(table)
  return [...headerGroups].reverse()
}

// flat headers

export function table_getLeftFlatHeaders<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const leftHeaderGroups = table_getLeftHeaderGroups(table)
  return leftHeaderGroups
    .map((headerGroup) => {
      return headerGroup.headers
    })
    .flat()
}

export function table_getRightFlatHeaders<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const rightHeaderGroups = table_getRightHeaderGroups(table)
  return rightHeaderGroups
    .map((headerGroup) => {
      return headerGroup.headers
    })
    .flat()
}

export function table_getCenterFlatHeaders<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const centerHeaderGroups = table_getCenterHeaderGroups(table)
  return centerHeaderGroups
    .map((headerGroup) => {
      return headerGroup.headers
    })
    .flat()
}

// leaf headers

export function table_getLeftLeafHeaders<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return table_getLeftFlatHeaders(table).filter(
    (header) => !header.subHeaders.length,
  )
}

export function table_getRightLeafHeaders<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return table_getRightFlatHeaders(table).filter(
    (header) => !header.subHeaders.length,
  )
}

export function table_getCenterLeafHeaders<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return table_getCenterFlatHeaders(table).filter(
    (header) => !header.subHeaders.length,
  )
}

// leaf columns

export function table_getLeftLeafColumns<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const { left } =
    table.options.state?.columnPinning ?? getDefaultColumnPinningState()
  return left
    .map(
      (columnId) =>
        table.getAllColumns().find((column) => column.id === columnId)!,
    )
    .filter(Boolean)
}

export function table_getRightLeafColumns<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const { right } =
    table.options.state?.columnPinning ?? getDefaultColumnPinningState()
  return right
    .map(
      (columnId) =>
        table.getAllColumns().find((column) => column.id === columnId)!,
    )
    .filter(Boolean)
}

export function table_getCenterLeafColumns<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  const { left, right } =
    table.options.state?.columnPinning ?? getDefaultColumnPinningState()
  const leftAndRight: Array<string> = [...left, ...right]
  return table.getAllColumns().filter((d) => !leftAndRight.includes(d.id))
}

// visible leaf columns

export function table_getLeftVisibleLeafColumns<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return table_getLeftLeafColumns(table).filter((column) =>
    column_getIsVisible(column),
  )
}

export function table_getRightVisibleLeafColumns<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return table_getRightLeafColumns(table).filter((column) =>
    column_getIsVisible(column),
  )
}

export function table_getCenterVisibleLeafColumns<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>) {
  return table_getCenterLeafColumns(table).filter((column) =>
    column_getIsVisible(column),
  )
}
