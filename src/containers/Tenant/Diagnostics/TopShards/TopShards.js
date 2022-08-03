import {useContext, useEffect, useMemo} from 'react';
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

import './TopShards.scss';

const b = cn('top-shards');
const bLink = cn('yc-link');

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
    useEffect(() => {
        if (autorefresh) {
            autofetcher.start();
            autofetcher.fetch(() => sendShardQuery({database: path, path: currentSchemaPath}));
        } else {
            autofetcher.stop();
        }
        return () => {
            autofetcher.stop();
        };
    }, [autorefresh]);

    useEffect(() => {
        sendShardQuery({database: path, path: currentSchemaPath});
        setShardQueryOptions({
            wasLoaded: false,
            data: undefined,
        });
    }, [currentSchemaPath]);

    const history = useContext(HistoryContext);

    const onSchemaClick = (schemaPath) => {
        return () => {
            setCurrentSchemaPath(schemaPath);
            getSchema({path: schemaPath});
            history.go(0);
        };
    };

    const tableColumns = useMemo(() => {
        return [
            {
                name: tableColumnsNames.Path,
                // eslint-disable-next-line
                render: ({value}) => {
                    return (
                        <span onClick={onSchemaClick(value)} className={bLink({view: 'normal'})}>
                            {value}
                        </span>
                    );
                },
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
        if (error) {
            return prepareQueryError(error);
        }

        return data && data.length > 0 ? (
            <div className={b('table')}>
                <DataTable
                    columns={tableColumns}
                    data={data}
                    settings={DEFAULT_TABLE_SETTINGS}
                    className={b('table')}
                    theme="yandex-cloud"
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
