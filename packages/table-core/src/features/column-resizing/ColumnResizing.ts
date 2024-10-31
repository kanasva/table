import { assignAPIs, makeStateUpdater } from '../../utils'
import {
  column_getCanResize,
  column_getIsResizing,
  getDefaultColumnResizingState,
  header_getResizeHandler,
  table_resetHeaderSizeInfo,
  table_setColumnResizing,
} from './ColumnResizing.utils'
import type { TableState_All } from '../../types/TableState'
import type { CellData, RowData } from '../../types/type-utils'
import type { TableFeature, TableFeatures } from '../../types/TableFeatures'
import type { Table_Internal } from '../../types/Table'
import type { Header } from '../../types/Header'
import type { Column } from '../../types/Column'
import type {
  ColumnResizingDefaultOptions,
  Header_ColumnResizing,
} from './ColumnResizing.types'

/**
 * The Column Resizing feature adds column resizing state and APIs to the table and column objects.
 *
 * **Note:** This is dependent on the Column Sizing feature.
 * [API Docs](https://tanstack.com/table/v8/docs/api/features/column-resizing)
 * [Guide](https://tanstack.com/table/v8/docs/guide/column-resizing)
 */
export const ColumnResizing: TableFeature = {
  getInitialState: (
    initialState: Partial<TableState_All>,
  ): Partial<TableState_All> => {
    return {
      columnResizing: getDefaultColumnResizingState(),
      ...initialState,
    }
  },

  getDefaultTableOptions: <
    TFeatures extends TableFeatures,
    TData extends RowData,
  >(
    table: Table_Internal<TFeatures, TData>,
  ): ColumnResizingDefaultOptions => {
    return {
      columnResizeMode: 'onEnd',
      columnResizeDirection: 'ltr',
      onColumnResizingChange: makeStateUpdater('columnResizing', table),
    }
  },

  constructColumnAPIs: <
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  >(
    column: Column<TFeatures, TData, TValue>,
  ): void => {
    assignAPIs(column, [
      {
        fn: () => column_getCanResize(column),
      },
      {
        fn: () => column_getIsResizing(column),
      },
    ])
  },

  constructHeaderAPIs: <
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  >(
    header: Header<TFeatures, TData, TValue> & Partial<Header_ColumnResizing>,
  ): void => {
    assignAPIs(header, [
      {
        fn: (_contextDocument) =>
          header_getResizeHandler(header, _contextDocument),
      },
    ])
  },

  constructTableAPIs: <TFeatures extends TableFeatures, TData extends RowData>(
    table: Table_Internal<TFeatures, TData>,
  ): void => {
    assignAPIs(table, [
      {
        fn: (updater) => table_setColumnResizing(table, updater),
      },
      {
        fn: (defaultState) => table_resetHeaderSizeInfo(table, defaultState),
      },
    ])
  },
}
