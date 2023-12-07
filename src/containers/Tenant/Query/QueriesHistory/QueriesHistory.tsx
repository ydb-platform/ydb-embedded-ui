import {useDispatch} from 'react-redux';
import block from 'bem-cn-lite';

import DataTable, {Column} from '@gravity-ui/react-data-table';

import type {QueryInHistory} from '../../../../types/store/executeQuery';
import {TruncatedQuery} from '../../../../components/TruncatedQuery/TruncatedQuery';
import {setQueryTab} from '../../../../store/reducers/tenant/tenant';
import {selectQueriesHistory} from '../../../../store/reducers/executeQuery';
import {TENANT_QUERY_TABS_ID} from '../../../../store/reducers/tenant/constants';
import {useQueryModes, useTypedSelector} from '../../../../utils/hooks';
import {QUERY_MODES, QUERY_SYNTAX} from '../../../../utils/query';
import {MAX_QUERY_HEIGHT, QUERY_TABLE_SETTINGS} from '../../utils/constants';

import i18n from '../i18n';

import './QueriesHistory.scss';

const b = block('ydb-queries-history');

interface QueriesHistoryProps {
    changeUserInput: (value: {input: string}) => void;
}

function QueriesHistory({changeUserInput}: QueriesHistoryProps) {
    const dispatch = useDispatch();

    const [queryMode, setQueryMode] = useQueryModes();

    const queriesHistory = useTypedSelector(selectQueriesHistory);
    const reversedHistory = [...queriesHistory].reverse();

    const onQueryClick = (query: QueryInHistory) => {
        if (query.syntax === QUERY_SYNTAX.pg && queryMode !== QUERY_MODES.pg) {
            setQueryMode(QUERY_MODES.pg);
        } else if (query.syntax !== QUERY_SYNTAX.pg && queryMode === QUERY_MODES.pg) {
            // Set query mode for queries with yql syntax
            setQueryMode(QUERY_MODES.script);
        }

        changeUserInput({input: query.queryText});
        dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
    };

    const columns: Column<QueryInHistory>[] = [
        {
            name: 'queryText',
            header: 'Query Text',
            render: ({row}) => {
                return (
                    <div className={b('query')}>
                        <TruncatedQuery value={row.queryText} maxQueryHeight={MAX_QUERY_HEIGHT} />
                    </div>
                );
            },
            sortable: false,
        },
        {
            name: 'syntax',
            header: 'Syntax',
            render: ({row}) => {
                return row.syntax === QUERY_SYNTAX.pg ? 'PostgreSQL' : 'YQL';
            },
            sortable: false,
            width: 200,
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
                rowClassName={() => b('table-row')}
            />
        </div>
    );
}

export default QueriesHistory;
