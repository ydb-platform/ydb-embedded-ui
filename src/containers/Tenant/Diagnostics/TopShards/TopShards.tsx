import {useState, useContext, useEffect, useMemo} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import DataTable, {Column, Settings, SortOrder} from '@yandex-cloud/react-data-table';
import {Loader} from '@gravity-ui/uikit';

import InternalLink from '../../../../components/InternalLink/InternalLink';

import HistoryContext from '../../../../contexts/HistoryContext';

import routes, {createHref} from '../../../../routes';

import {sendShardQuery, setShardQueryOptions} from '../../../../store/reducers/shardsWorkload';
import {setCurrentSchemaPath, getSchema} from '../../../../store/reducers/schema';

import type {EPathType} from '../../../../types/api/schema';

import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {i18n} from '../../../../utils/i18n';
import {prepareQueryError} from '../../../../utils/query';

import {isColumnEntityType} from '../../utils/schema';

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
};

function prepareCPUWorkloadValue(value: string) {
    return `${(Number(value) * 100).toFixed(2)}%`;
}

function prepareDateSizeValue(value: number) {
    return new Intl.NumberFormat(i18n.lang).format(value);
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
    return (
        value &&
        value.split(',').map((columnId) => ({
            columnId,
            order: 'DESC',
        }))
    );
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
        error,
        wasLoaded,
    } = useTypedSelector((state) => state.shardsWorkload);

    const [sortOrder, setSortOrder] = useState(tableColumnsNames.CPUCores);

    useAutofetcher(
        () => {
            dispatch(
                sendShardQuery({
                    database: tenantPath,
                    path: currentSchemaPath,
                    sortOrder: stringToQuerySortOrder(sortOrder),
                }),
            );
        },
        [dispatch, currentSchemaPath, tenantPath, sortOrder],
        autorefresh,
    );

    // don't show loader for requests triggered by table sort, only for path change
    useEffect(() => {
        dispatch(
            setShardQueryOptions({
                wasLoaded: false,
                data: undefined,
            }),
        );
    }, [dispatch, currentSchemaPath, tenantPath]);

    const history = useContext(HistoryContext);

    const onSort = (newSortOrder?: SortOrder | SortOrder[]) => {
        // omit information about sort order to disable ASC order, only DESC makes sense for top shards
        // use a string (and not the DataTable default format) to prevent reference change,
        // which would cause an excess state change, to avoid repeating requests
        setSortOrder(dataTableToStringSortOrder(newSortOrder));
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
                    return prepareDateSizeValue(value as number);
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

        if (!data || data.length === 0 || isColumnEntityType(type)) {
            return 'No data';
        }

        if (error && !error.isCancelled) {
            return prepareQueryError(error);
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
            {renderContent()}
        </div>
    );
};
