import {useState, useContext, useEffect, useMemo} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import DataTable, {Column, Settings, SortOrder} from '@gravity-ui/react-data-table';
import {Loader} from '@gravity-ui/uikit';

import {DateRange, DateRangeValues} from '../../../../components/DateRange';
import {InternalLink} from '../../../../components/InternalLink';

import HistoryContext from '../../../../contexts/HistoryContext';

import routes, {createHref} from '../../../../routes';

import {
    sendShardQuery,
    setShardsState,
    setShardsQueryFilters,
} from '../../../../store/reducers/shardsWorkload';
import {setCurrentSchemaPath, getSchema} from '../../../../store/reducers/schema';
import type {IShardsWorkloadFilters} from '../../../../types/store/shardsWorkload';

import type {EPathType} from '../../../../types/api/schema';

import {formatDateTime, formatNumber} from '../../../../utils';
import {DEFAULT_TABLE_SETTINGS, HOUR_IN_SECONDS} from '../../../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {prepareQueryError} from '../../../../utils/query';

import {getDefaultNodePath} from '../../../Node/NodePages';

import {isColumnEntityType} from '../../utils/schema';

import i18n from './i18n';
import './TopShards.scss';

const b = cn('top-shards');
const bLink = cn('yc-link');

const TABLE_SETTINGS: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    dynamicRender: false, // no more than 20 rows
    externalSort: true,
    disableSortReset: true,
    defaultOrder: DataTable.DESCENDING,
};

const tableColumnsNames = {
    TabletId: 'TabletId',
    CPUCores: 'CPUCores',
    DataSize: 'DataSize',
    Path: 'Path',
    NodeId: 'NodeId',
    PeakTime: 'PeakTime',
    InFlightTxCount: 'InFlightTxCount',
    IntervalEnd: 'IntervalEnd',
};

function prepareCPUWorkloadValue(value: string) {
    return `${(Number(value) * 100).toFixed(2)}%`;
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

interface TopShardsProps {
    tenantPath: string;
    type?: EPathType;
}

export const TopShards = ({tenantPath, type}: TopShardsProps) => {
    const dispatch = useDispatch();

    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);

    const {
        loading,
        data: {result: data = undefined} = {},
        filters: storeFilters,
        error,
        wasLoaded,
    } = useTypedSelector((state) => state.shardsWorkload);

    // default date range should be the last hour, but shouldn't propagate into URL until user interacts with the control
    // redux initial value can't be used, as it synchronizes with URL
    const [filters, setFilters] = useState<IShardsWorkloadFilters>(() => {
        if (!storeFilters?.from && !storeFilters?.to) {
            return {
                from: Date.now() - HOUR_IN_SECONDS * 1000,
                to: Date.now(),
            };
        }

        return storeFilters;
    });

    const [sortOrder, setSortOrder] = useState(tableColumnsNames.CPUCores);

    useAutofetcher(
        () => {
            dispatch(
                sendShardQuery({
                    database: tenantPath,
                    path: currentSchemaPath,
                    sortOrder: stringToQuerySortOrder(sortOrder),
                    filters,
                }),
            );
        },
        [dispatch, tenantPath, currentSchemaPath, sortOrder, filters],
        autorefresh,
    );

    // don't show loader for requests triggered by table sort, only for path change
    useEffect(() => {
        dispatch(
            setShardsState({
                wasLoaded: false,
                data: undefined,
            }),
        );
    }, [dispatch, currentSchemaPath, tenantPath, filters]);

    const history = useContext(HistoryContext);

    const onSort = (newSortOrder?: SortOrder | SortOrder[]) => {
        // omit information about sort order to disable ASC order, only DESC makes sense for top shards
        // use a string (and not the DataTable default format) to prevent reference change,
        // which would cause an excess state change, to avoid repeating requests
        setSortOrder(dataTableToStringSortOrder(newSortOrder));
    };

    const handleDateRangeChange = (value: DateRangeValues) => {
        dispatch(setShardsQueryFilters(value));
        setFilters(value);
    };

    const tableColumns: Column<any>[] = useMemo(() => {
        const onSchemaClick = (schemaPath: string) => {
            return () => {
                dispatch(setCurrentSchemaPath(schemaPath));
                dispatch(getSchema({path: schemaPath}));
                history.go(0);
            };
        };

        return [
            {
                name: tableColumnsNames.Path,
                render: ({value: relativeNodePath}) => {
                    return (
                        <span
                            onClick={onSchemaClick(tenantPath + relativeNodePath)}
                            className={bLink({view: 'normal'})}
                        >
                            {relativeNodePath as string}
                        </span>
                    );
                },
                sortable: false,
            },
            {
                name: tableColumnsNames.CPUCores,
                render: ({value}) => {
                    return prepareCPUWorkloadValue(value as string);
                },
                align: DataTable.RIGHT,
            },
            {
                name: tableColumnsNames.DataSize,
                header: 'DataSize (B)',
                render: ({value}) => {
                    return formatNumber(value as number);
                },
                align: DataTable.RIGHT,
            },
            {
                name: tableColumnsNames.TabletId,
                render: ({value}) => {
                    return (
                        <InternalLink to={createHref(routes.tablet, {id: value})}>
                            {value as string}
                        </InternalLink>
                    );
                },
                sortable: false,
            },
            {
                name: tableColumnsNames.NodeId,
                render: ({value: nodeId}) => {
                    return (
                        <InternalLink to={getDefaultNodePath(nodeId as string)}>
                            {nodeId as string}
                        </InternalLink>
                    );
                },
                align: DataTable.RIGHT,
                sortable: false,
            },
            {
                name: tableColumnsNames.PeakTime,
                render: ({value}) => formatDateTime(new Date(value as string).valueOf()),
                sortable: false,
            },
            {
                name: tableColumnsNames.InFlightTxCount,
                render: ({value}) => formatNumber(value as number),
                align: DataTable.RIGHT,
                sortable: false,
            },
            {
                name: tableColumnsNames.IntervalEnd,
                render: ({value}) => formatDateTime(new Date(value as string).getTime()),
            }
        ];
    }, [dispatch, history, tenantPath]);

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderContent = () => {
        if (loading && !wasLoaded) {
            return renderLoader();
        }

        if (error && !error.isCancelled) {
            return <div className="error">{prepareQueryError(error)}</div>;
        }

        if (!data || isColumnEntityType(type)) {
            return i18n('no-data');
        }

        return (
            <div className={b('table')}>
                <DataTable
                    columns={tableColumns}
                    data={data}
                    settings={TABLE_SETTINGS}
                    theme="yandex-cloud"
                    onSort={onSort}
                    sortOrder={stringToDataTableSortOrder(sortOrder)}
                />
            </div>
        );
    };

    return (
        <div className={b()}>
            <div className={b('controls')}>
                {i18n('description')}
                <DateRange from={filters.from} to={filters.to} onChange={handleDateRangeChange} />
            </div>
            {renderContent()}
        </div>
    );
};
