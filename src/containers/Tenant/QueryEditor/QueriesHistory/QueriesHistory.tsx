import {useDispatch} from 'react-redux';
import block from 'bem-cn-lite';

import DataTable, {Column} from '@gravity-ui/react-data-table';

import TruncatedQuery from '../../../../components/TruncatedQuery/TruncatedQuery';
import {setQueryTab} from '../../../../store/reducers/tenant/tenant';
import {TENANT_QUERY_TABS_ID} from '../../../../store/reducers/tenant/constants';
import {useTypedSelector} from '../../../../utils/hooks';
import {MAX_QUERY_HEIGHT, QUERY_TABLE_SETTINGS} from '../../utils/constants';

import i18n from '../i18n';

import './QueriesHistory.scss';

const b = block('ydb-queries-history');

interface QueriesHistoryProps {
    changeUserInput: (value: {input: string}) => void;
}

function QueriesHistory({changeUserInput}: QueriesHistoryProps) {
    const dispatch = useDispatch();

    const queriesHistory = useTypedSelector((state) => state.executeQuery.history.queries) ?? [];
    const reversedHistory = [...queriesHistory].reverse();

    const onQueryClick = (queryText: string) => {
        changeUserInput({input: queryText});
        dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
    };

    const columns: Column<string>[] = [
        {
            name: 'queryText',
            header: 'Query Text',
            render: ({row: query}) => (
                <div className={b('query')}>
                    <TruncatedQuery value={query} maxQueryHeight={MAX_QUERY_HEIGHT} />
                </div>
            ),
            sortable: false,
        },
    ];

    return (
        <div className={b()}>
            <DataTable
                theme="yandex-cloud"
                columns={columns}
                data={reversedHistory}
                settings={QUERY_TABLE_SETTINGS}
                emptyDataMessage={i18n('history.empty')}
                onRowClick={(row) => onQueryClick(row)}
            />
        </div>
    );
}

export default QueriesHistory;
