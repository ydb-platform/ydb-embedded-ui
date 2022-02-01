import {useEffect, useMemo} from 'react';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import {Loader} from '@yandex-cloud/uikit';
import DataTable from '@yandex-cloud/react-data-table';

import Icon from '../../../../components/Icon/Icon';

import {AutoFetcher} from '../../../../utils/autofetcher';
import {getHotKeys, setHotKeysOptions} from '../../../../store/reducers/hotKeys';

import './HotKeys.scss';
import {TABLE_TYPE} from '../../Tenant';

const b = cn('hot-keys');

const TABLE_SETTINGS = {
    displayIndices: false,
    syncHeadOnResize: true,
    stickyHead: DataTable.MOVING,
    stickyTop: 0,
};

const tableColumnsIds = {
    accessSample: 'accessSample',
    keyValues: 'keyValues',
};

const autofetcher = new AutoFetcher();

function HotKeys({
    getHotKeys,
    currentSchemaPath,
    loading,
    wasLoaded,
    error,
    data,
    autorefresh,
    setHotKeysOptions,
    currentSchema,
    type,
}) {
    const fetchData = () => {
        if (type === TABLE_TYPE) {
            getHotKeys(currentSchemaPath);
        }
    };
    useEffect(() => {
        if (autorefresh) {
            fetchData();
            autofetcher.start();
            autofetcher.fetch(() => fetchData());
        } else {
            autofetcher.stop();
        }
        return () => {
            autofetcher.stop();
        };
    }, [autorefresh]);

    useEffect(() => {
        fetchData();
        setHotKeysOptions({
            wasLoaded: false,
            data: undefined,
        });
    }, [currentSchemaPath]);

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="l" />
            </div>
        );
    };

    const tableColumns = useMemo(() => {
        const keyColumnsIds = currentSchema?.PathDescription?.Table?.KeyColumnNames ?? [];

        return [
            {
                name: tableColumnsIds.accessSample,
                header: 'Samples',
                sortable: false,
                align: DataTable.RIGHT,
            },
            ...keyColumnsIds?.map((col, index) => ({
                name: col,
                header: (
                    <div className={b('primary-key-column')}>
                        <Icon name="key" viewBox="0 0 12 7" width={12} height={7} />
                        {col}
                    </div>
                ),
                render: ({row}) => row[tableColumnsIds.keyValues][index],
                align: DataTable.RIGHT,
                sortable: false,
            })),
        ];
    }, [currentSchema]);

    const renderStub = () => {
        return <div className={b('stub')}>Cluster version does not support hot keys viewing</div>;
    };

    const renderContent = () => {
        if (error) {
            return error.data;
        }
        return data !== null ? (
            <div className={b('table-content')}>
                <DataTable
                    columns={tableColumns}
                    data={data}
                    settings={TABLE_SETTINGS}
                    theme="yandex-cloud"
                    initialSortOrder={{
                        columnId: tableColumnsIds.accessSample,
                        order: DataTable.DESCENDING,
                    }}
                />
            </div>
        ) : (
            <div className={b('stub')}>No information about hot keys</div>
        );
    };

    return !loading && data === undefined ? (
        renderStub()
    ) : (
        <div className={b()}>{loading && !wasLoaded ? renderLoader() : renderContent()}</div>
    );
}

const mapStateToProps = (state) => {
    const {loading, data, error, wasLoaded} = state.hotKeys;
    const {currentSchema = {}, autorefresh} = state.schema;
    const {Path} = currentSchema;
    return {
        loading,
        data,
        error,
        currentSchemaPath: Path,
        autorefresh,
        wasLoaded,
        currentSchema,
    };
};

const mapDispatchToProps = {
    getHotKeys,
    setHotKeysOptions,
};

export default connect(mapStateToProps, mapDispatchToProps)(HotKeys);
