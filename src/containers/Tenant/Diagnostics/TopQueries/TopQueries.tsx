import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import DataTable, {Column} from '@yandex-cloud/react-data-table';
import {Loader} from '@gravity-ui/uikit';

import TruncatedQuery from '../../../../components/TruncatedQuery/TruncatedQuery';

import {changeUserInput} from '../../../../store/reducers/executeQuery';
import {fetchTopQueries, setTopQueriesState} from '../../../../store/reducers/executeTopQueries';

import type {KeyValueRow} from '../../../../types/api/query';
import type {EPathType} from '../../../../types/api/schema';

import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {prepareQueryError} from '../../../../utils/query';

import {isColumnEntityType} from '../../utils/schema';
import {TenantGeneralTabsIds} from '../../TenantPages';

import i18n from './i18n';
import './TopQueries.scss';
import {useCallback, useEffect} from 'react';

const b = cn('kv-top-queries');

const MAX_QUERY_HEIGHT = 10;
const COLUMNS: Column<KeyValueRow>[] = [
    {
        name: 'CPUTimeUs',
        width: 140,
        sortAccessor: (row) => Number(row['CPUTimeUs']),
    },
    {
        name: 'QueryText',
        width: 500,
        sortable: false,
        render: ({value}) => <TruncatedQuery value={value} maxQueryHeight={MAX_QUERY_HEIGHT} />,
    },
];

interface TopQueriesProps {
    path: string;
    changeSchemaTab: (tab: TenantGeneralTabsIds) => void;
    type?: EPathType;
}

export const TopQueries = ({path, type, changeSchemaTab}: TopQueriesProps) => {
    const dispatch = useDispatch();

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const {
        loading,
        wasLoaded,
        error,
        data: {result: data = undefined} = {},
    } = useTypedSelector((state) => state.executeTopQueries);

    useAutofetcher(
        () => dispatch(fetchTopQueries({database: path})),
        [dispatch, path],
        autorefresh,
    );

    useEffect(() => {
        dispatch(
            setTopQueriesState({
                wasLoaded: false,
                data: undefined,
            }),
        );
    }, [dispatch, path]);

    const handleRowClick = useCallback(
        (row) => {
            const {QueryText: input} = row;

            dispatch(changeUserInput({input}));
            changeSchemaTab(TenantGeneralTabsIds.query);
        },
        [changeSchemaTab, dispatch],
    );

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
            <div className={b('result')}>
                <div className={b('table-wrapper')}>
                    <div className={b('table-content')}>
                        <DataTable
                            columns={COLUMNS}
                            data={data}
                            settings={DEFAULT_TABLE_SETTINGS}
                            onRowClick={handleRowClick}
                            theme="yandex-cloud"
                        />
                    </div>
                </div>
            </div>
        );
    };

    return <div className={b()}>{renderContent()}</div>;
};
