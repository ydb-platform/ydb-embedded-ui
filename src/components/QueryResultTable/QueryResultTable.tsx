import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import type {Column, Settings} from '@gravity-ui/react-data-table';

import type {ColumnType, KeyValueRow} from '../../types/api/query';
import {cn} from '../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {getColumnWidth} from '../../utils/getColumnWidth';
import {getColumnType} from '../../utils/query';
import {isNumeric} from '../../utils/utils';
import type {ResizeableDataTableProps} from '../ResizeableDataTable/ResizeableDataTable';
import {ResizeableDataTable} from '../ResizeableDataTable/ResizeableDataTable';

import {Cell} from './Cell';
import i18n from './i18n';

import './QueryResultTable.scss';

const TABLE_SETTINGS: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    stripedRows: true,
    sortable: false,
    displayIndices: true,
};

export const b = cn('ydb-query-result-table');

const WIDTH_PREDICTION_ROWS_COUNT = 100;

type ActiveCellState = {
    row: KeyValueRow;
    columnName: string;
} | null;

type ActiveCellAction = {
    type: 'toggle';
    payload: {
        row: KeyValueRow;
        columnName: string;
    };
};

function activeCellReducer(state: ActiveCellState, action: ActiveCellAction): ActiveCellState {
    switch (action.type) {
        case 'toggle':
            if (
                state &&
                state.row === action.payload.row &&
                state.columnName === action.payload.columnName
            ) {
                return null;
            }
            return action.payload;
        default:
            return state;
    }
}

type RenderCellArgs = {row: KeyValueRow; columnName: string};
type RenderCell = (args: RenderCellArgs) => React.ReactNode;

interface CreateRenderCellParams {
    activeCellRef: React.RefObject<ActiveCellState>;
    dispatch: React.Dispatch<ActiveCellAction>;
}

function createRenderCell({activeCellRef, dispatch}: CreateRenderCellParams): RenderCell {
    return ({row, columnName}: RenderCellArgs) => {
        const isActive = Boolean(
            activeCellRef.current &&
                activeCellRef.current.row === row &&
                activeCellRef.current.columnName === columnName,
        );

        const value = row[columnName];

        const onToggle = () => {
            dispatch({
                type: 'toggle',
                payload: {row, columnName},
            });
        };

        return <Cell value={String(value)} isActive={isActive} onToggle={onToggle} />;
    };
}

const prepareTypedColumns = (
    columns: ColumnType[],
    data: KeyValueRow[] | undefined,
    renderCell: RenderCell,
) => {
    if (!columns.length) {
        return [];
    }

    const dataSlice = data?.slice(0, WIDTH_PREDICTION_ROWS_COUNT);

    return columns.map(({name, type}) => {
        const columnType = getColumnType(type);

        const column: Column<KeyValueRow> = {
            name,
            width: getColumnWidth({data: dataSlice, name}),
            align: columnType === 'number' ? DataTable.RIGHT : DataTable.LEFT,
            render: ({row}) => renderCell({row, columnName: name}),
        };

        return column;
    });
};

const prepareGenericColumns = (data: KeyValueRow[] | undefined, renderCell: RenderCell) => {
    if (!data?.length) {
        return [];
    }

    const dataSlice = data?.slice(0, WIDTH_PREDICTION_ROWS_COUNT);

    return Object.keys(data[0]).map((name) => {
        const column: Column<KeyValueRow> = {
            name,
            width: getColumnWidth({data: dataSlice, name}),
            align: isNumeric(data[0][name]) ? DataTable.RIGHT : DataTable.LEFT,
            render: ({row}) => renderCell({row, columnName: name}),
        };

        return column;
    });
};

const getRowIndex = (_: unknown, index: number) => index;

// Display row number in format 1-10 instead of 0-9
const getVisibleRowIndex = (_: unknown, index: number) => index + 1;

interface QueryResultTableProps
    extends Omit<ResizeableDataTableProps<KeyValueRow>, 'data' | 'columns'> {
    data?: KeyValueRow[];
    columns?: ColumnType[];
    settings?: Partial<Settings>;
}

export const QueryResultTable = (props: QueryResultTableProps) => {
    const {columns, data, settings: propsSettings} = props;

    const [activeCell, dispatch] = React.useReducer(activeCellReducer, null);

    const activeCellRef = React.useRef<ActiveCellState>(null);

    React.useEffect(() => {
        activeCellRef.current = activeCell;
    }, [activeCell]);

    const renderCell = React.useMemo(() => createRenderCell({activeCellRef, dispatch}), [dispatch]);

    const preparedColumns = React.useMemo(() => {
        return columns
            ? prepareTypedColumns(columns, data, renderCell)
            : prepareGenericColumns(data, renderCell);
    }, [columns, data, renderCell]);

    const settings = React.useMemo(() => {
        return {
            ...TABLE_SETTINGS,
            ...propsSettings,
        };
    }, [propsSettings]);

    // empty data is expected to be be an empty array
    // undefined data is not rendered at all
    if (!Array.isArray(data)) {
        return null;
    }

    if (!preparedColumns.length) {
        return <div className={b('message')}>{i18n('empty')}</div>;
    }

    return (
        <ResizeableDataTable
            data={data}
            columns={preparedColumns}
            settings={settings}
            // prevent accessing row.id in case it is present but is not the PK (i.e. may repeat)
            rowKey={getRowIndex}
            visibleRowIndex={getVisibleRowIndex}
            wrapperClassName={b('table-wrapper')}
        />
    );
};
