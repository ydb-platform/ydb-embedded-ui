import React from 'react';

import type {Column, Settings, SortOrder} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {useLocation} from 'react-router-dom';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    setShardsQueryFilters,
    shardApi,
} from '../../../../store/reducers/shardsWorkload/shardsWorkload';
import {EShardsWorkloadMode} from '../../../../store/reducers/shardsWorkload/types';
import type {ShardsWorkloadFilters} from '../../../../store/reducers/shardsWorkload/types';
import type {CellValue, KeyValueRow} from '../../../../types/api/query';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {formatDateTime} from '../../../../utils/dataFormatters/dataFormatters';
import {TOP_SHARD_COLUMNS_IDS, isSortableTopShardsProperty} from '../../../../utils/diagnostics';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';
import {isColumnEntityType} from '../../utils/schema';

import {Filters} from './Filters';
import {TOP_SHARDS_COLUMNS_WIDTH_LS_KEY, getShardsWorkloadColumns} from './getTopShardsColumns';
import i18n from './i18n';

import './TopShards.scss';

const b = cn('top-shards');

const TABLE_SETTINGS: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    dynamicRender: false, // no more than 20 rows
    externalSort: true,
    disableSortReset: true,
    defaultOrder: DataTable.DESCENDING,
};

function prepareDateTimeValue(value: CellValue) {
    if (!value) {
        return '–';
    }
    return formatDateTime(new Date(value).getTime());
}

function stringToDataTableSortOrder(value: string): SortOrder[] | undefined {
    return value
        ? value.split(',').map((columnId) => ({
              columnId,
              order: DataTable.DESCENDING,
          }))
        : undefined;
}

function stringToQuerySortOrder(value: string) {
    return value
        ? value.split(',').map((columnId) => ({
              columnId,
              order: 'DESC',
          }))
        : undefined;
}

function dataTableToStringSortOrder(value: SortOrder | SortOrder[] = []) {
    const sortOrders = Array.isArray(value) ? value : [value];
    return sortOrders.map(({columnId}) => columnId).join(',');
}

function fillDateRangeFor(value: ShardsWorkloadFilters) {
    value.to = 'now';
    value.from = 'now-1h';
    return value;
}

interface TopShardsProps {
    tenantName: string;
    path: string;
    type?: EPathType;
}

export const TopShards = ({tenantName, path, type}: TopShardsProps) => {
    const dispatch = useTypedDispatch();
    const location = useLocation();

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const storeFilters = useTypedSelector((state) => state.shardsWorkload);

    // default filters shouldn't propagate into URL until user interacts with the control
    // redux initial value can't be used, as it synchronizes with URL
    const [filters, setFilters] = React.useState<ShardsWorkloadFilters>(() => {
        const defaultValue = {...storeFilters};

        if (!defaultValue.mode) {
            defaultValue.mode = EShardsWorkloadMode.Immediate;
        }

        if (!defaultValue.from && !defaultValue.to) {
            fillDateRangeFor(defaultValue);
        }

        return defaultValue;
    });

    const [sortOrder, setSortOrder] = React.useState(TOP_SHARD_COLUMNS_IDS.CPUCores);
    const {
        currentData: result,
        isFetching,
        error,
    } = shardApi.useSendShardQueryQuery(
        {
            database: tenantName,
            path: path,
            sortOrder: stringToQuerySortOrder(sortOrder),
            filters,
        },
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && result === undefined;
    const data = result?.resultSets?.[0]?.result || [];

    const onSort = (newSortOrder?: SortOrder | SortOrder[]) => {
        // omit information about sort order to disable ASC order, only DESC makes sense for top shards
        // use a string (and not the DataTable default format) to prevent reference change,
        // which would cause an excess state change, to avoid repeating requests
        setSortOrder(dataTableToStringSortOrder(newSortOrder));
    };

    const handleFiltersChange = (value: Partial<ShardsWorkloadFilters>) => {
        const newStateValue = {...value};
        const isDateRangePristine =
            !storeFilters.from && !storeFilters.to && !value.from && !value.to;

        if (isDateRangePristine) {
            switch (value.mode) {
                case EShardsWorkloadMode.Immediate:
                    newStateValue.from = newStateValue.to = undefined;
                    break;
                case EShardsWorkloadMode.History:
                    // should default to the current datetime every time history mode activates
                    fillDateRangeFor(newStateValue);
                    break;
            }
        }

        dispatch(setShardsQueryFilters(value));
        setFilters((state) => ({...state, ...newStateValue}));
    };

    const tableColumns = React.useMemo(() => {
        const rawColumns: Column<KeyValueRow>[] = getShardsWorkloadColumns(tenantName, location);

        const columns: Column<KeyValueRow>[] = rawColumns.map((column) => ({
            ...column,
            sortable: isSortableTopShardsProperty(column.name),
        }));

        if (filters.mode === EShardsWorkloadMode.History) {
            // after NodeId
            columns.splice(5, 0, {
                name: TOP_SHARD_COLUMNS_IDS.PeakTime,
                render: ({row}) => {
                    return prepareDateTimeValue(row.PeakTime);
                },
                sortable: false,
            });
            columns.push({
                name: TOP_SHARD_COLUMNS_IDS.IntervalEnd,
                render: ({row}) => {
                    return prepareDateTimeValue(row.IntervalEnd);
                },
            });
        }

        return columns;
    }, [filters.mode, location, tenantName]);

    const renderControls = () => {
        return <Filters value={filters} onChange={handleFiltersChange} />;
    };

    const renderContent = () => {
        if (error && !data) {
            return null;
        }

        if (!data || isColumnEntityType(type)) {
            return i18n('no-data');
        }

        return (
            <ResizeableDataTable
                columnsWidthLSKey={TOP_SHARDS_COLUMNS_WIDTH_LS_KEY}
                columns={tableColumns}
                data={data}
                settings={TABLE_SETTINGS}
                onSort={onSort}
                sortOrder={stringToDataTableSortOrder(sortOrder)}
            />
        );
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>

            {filters.mode === EShardsWorkloadMode.History && (
                <div className={b('hint')}>{i18n('description')}</div>
            )}

            {error ? <ResponseError error={parseQueryErrorToString(error)} /> : null}
            <TableWithControlsLayout.Table loading={loading}>
                {renderContent()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
