import {useState, useContext, useEffect, useMemo} from 'react';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import {Loader} from '@yandex-cloud/uikit';
import DataTable from '@yandex-cloud/react-data-table';

import InternalLink from '../../../../components/InternalLink/InternalLink';

import routes, {createHref} from '../../../../routes';
import {sendShardQuery, setShardQueryOptions} from '../../../../store/reducers/shardsWorkload';
import {setCurrentSchemaPath, getSchema} from '../../../../store/reducers/schema';
import {AutoFetcher} from '../../../../utils/autofetcher';
import HistoryContext from '../../../../contexts/HistoryContext';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {isColumnEntityType} from '../../utils/schema';
import {prepareQueryError} from '../../../../utils';
import {i18n} from '../../../../utils/i18n';

import './TopShards.scss';

const b = cn('top-shards');
const bLink = cn('yc-link');

const TABLE_SETTINGS = {
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

const autofetcher = new AutoFetcher();

function prepareCPUWorkloadValue(value) {
    return `${(value * 100).toFixed(2)}%`;
}

function prepareDateSizeValue(value) {
    return new Intl.NumberFormat(i18n.lang).format(value);
}

function stringToDataTableSortOrder(value) {
    return value && value.split(',').map((columnId) => ({
        columnId,
        order: DataTable.DESCENDING,
    }));
}

function stringToQuerySortOrder(value) {
    return value && value.split(',').map((columnId) => ({
        columnId,
        order: 'DESC',
    }));
}

function dataTableToStringSortOrder(value = []) {
    return value.map(({columnId}) => columnId).join(',');
}

function TopShards({
    sendShardQuery,
    currentSchemaPath,
    path,
    loading,
    data,
    error,
    setCurrentSchemaPath,
    getSchema,
    autorefresh,
    wasLoaded,
    setShardQueryOptions,
    type,
}) {
    const [sortOrder, setSortOrder] = useState(tableColumnsNames.CPUCores);

    useEffect(() => {
        autofetcher.stop();

        if (autorefresh) {
            autofetcher.start();
            autofetcher.fetch(() => sendShardQuery({
                database: path,
                path: currentSchemaPath,
                sortOrder: stringToQuerySortOrder(sortOrder),
            }));
        }

        return () => {
            autofetcher.stop();
        };
    }, [autorefresh, currentSchemaPath, path, sendShardQuery, sortOrder]);

    // don't show loader for requests triggered by table sort, only for path change
    useEffect(() => {
        setShardQueryOptions({
            wasLoaded: false,
            data: undefined,
        });
    }, [currentSchemaPath, path, setShardQueryOptions]);

    useEffect(() => {
        sendShardQuery({
            database: path,
            path: currentSchemaPath,
            sortOrder: stringToQuerySortOrder(sortOrder),
        });
    }, [currentSchemaPath, path, sendShardQuery, sortOrder]);

    const history = useContext(HistoryContext);

    const onSchemaClick = (schemaPath) => {
        return () => {
            setCurrentSchemaPath(schemaPath);
            getSchema({path: schemaPath});
            history.go(0);
        };
    };

    const onSort = (newSortOrder) => {
        // omit information about sort order to disable ASC order, only DESC makes sense for top shards
        // use a string (and not the DataTable default format) to prevent reference change,
        // which would cause an excess state change, to avoid repeating requests
        setSortOrder(dataTableToStringSortOrder(newSortOrder));
    };

    const tableColumns = useMemo(() => {
        return [
            {
                name: tableColumnsNames.Path,
                // eslint-disable-next-line
                render: ({value}) => {
                    return (
                        <span
                            // tenant name is substringed out in sql query but is needed here
                            onClick={onSchemaClick(path + value)}
                            className={bLink({view: 'normal'})}
                        >
                            {value}
                        </span>
                    );
                },
                sortable: false,
            },
            {
                name: tableColumnsNames.CPUCores,
                // eslint-disable-next-line
                render: ({value}) => {
                    return prepareCPUWorkloadValue(value);
                },
                align: DataTable.RIGHT,
            },
            {
                name: tableColumnsNames.DataSize,
                header: 'DataSize (B)',
                render: ({value}) => {
                    return prepareDateSizeValue(value);
                },
                align: DataTable.RIGHT,
            },
            {
                name: tableColumnsNames.TabletId,
                // eslint-disable-next-line
                render: ({value}) => {
                    return (
                        <InternalLink to={createHref(routes.tablet, {id: value})}>
                            {value}
                        </InternalLink>
                    );
                },
                sortable: false,
            },
        ];
    }, []);

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderContent = () => {
        if (isColumnEntityType(type)) {
            return 'No data';
        }
        if (error && !error.isCancelled) {
            return prepareQueryError(error);
        }

        return data && data.length > 0 ? (
            <div className={b('table')}>
                <DataTable
                    columns={tableColumns}
                    data={data}
                    settings={TABLE_SETTINGS}
                    className={b('table')}
                    theme="yandex-cloud"
                    onSort={onSort}
                    sortOrder={stringToDataTableSortOrder(sortOrder)}
                />
            </div>
        ) : (
            data
        );
    };

    return loading && !wasLoaded ? renderLoader() : <div className={b()}>{renderContent()}</div>;
}

const mapStateToProps = (state) => {
    const {loading, data, error, wasLoaded} = state.shardsWorkload;
    const {autorefresh} = state.schema;
    return {
        loading,
        data,
        error,
        currentSchemaPath: state.schema?.currentSchema?.Path,
        autorefresh,
        wasLoaded,
    };
};

const mapDispatchToProps = {
    sendShardQuery,
    setCurrentSchemaPath,
    getSchema,
    setShardQueryOptions,
};

export default connect(mapStateToProps, mapDispatchToProps)(TopShards);
