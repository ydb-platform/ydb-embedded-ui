import React from 'react';

import type {Settings} from '@gravity-ui/react-data-table';

import {useComponent} from '../../../../components/ComponentsProvider/ComponentsProvider';
import {ResponseError} from '../../../../components/Errors/ResponseError';
import type {TopShardsColumnId} from '../../../../components/ShardsTable/constants';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    setShardsQueryFilters,
    shardApi,
} from '../../../../store/reducers/shardsWorkload/shardsWorkload';
import {EShardsWorkloadMode} from '../../../../store/reducers/shardsWorkload/types';
import type {ShardsWorkloadFilters} from '../../../../store/reducers/shardsWorkload/types';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';

import {Filters} from './Filters';
import i18n from './i18n';
import {useTopShardSort} from './utils';

import './TopShards.scss';

const b = cn('top-shards');

const TABLE_SETTINGS: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    dynamicRender: false, // no more than 20 rows
    externalSort: true,
    disableSortReset: true,
    defaultOrder: -1,
};

function fillDateRangeFor(value: ShardsWorkloadFilters) {
    value.to = 'now';
    value.from = 'now-1h';
    return value;
}

interface TopShardsProps {
    database: string;
    path: string;
    databaseFullPath: string;
}

export const TopShards = ({database, path, databaseFullPath}: TopShardsProps) => {
    const ShardsTable = useComponent('ShardsTable');

    const dispatch = useTypedDispatch();

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

    const {tableSort, handleTableSort, backendSort} = useTopShardSort();

    const {
        currentData: result,
        isFetching,
        error,
    } = shardApi.useSendShardQueryQuery(
        {
            database,
            path,
            sortOrder: backendSort,
            filters,
            databaseFullPath,
        },
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && result === undefined;
    const data = result?.resultSets?.[0]?.result || [];

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

    const columnsIds = React.useMemo(() => {
        let columns: TopShardsColumnId[];

        if (filters.mode === EShardsWorkloadMode.History) {
            // Add PeakTime and IntervalEnd columns
            columns = [
                'Path',
                'CPUCores',
                'DataSize',
                'TabletId',
                'NodeId',
                'PeakTime',
                'InFlightTxCount',
                'IntervalEnd',
            ];
        } else {
            columns = ['Path', 'CPUCores', 'DataSize', 'TabletId', 'NodeId', 'InFlightTxCount'];
        }

        return columns;
    }, [filters.mode]);

    const renderControls = () => {
        return <Filters value={filters} onChange={handleFiltersChange} />;
    };

    const renderContent = () => {
        if (error && !data) {
            return null;
        }

        return (
            <ShardsTable
                databaseFullPath={databaseFullPath}
                columnsIds={columnsIds}
                data={data}
                settings={TABLE_SETTINGS}
                onSort={handleTableSort}
                sortOrder={tableSort}
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
