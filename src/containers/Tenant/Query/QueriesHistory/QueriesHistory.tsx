import type {Column} from '@gravity-ui/react-data-table';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TruncatedQuery} from '../../../../components/TruncatedQuery/TruncatedQuery';
import {selectQueriesHistory} from '../../../../store/reducers/executeQuery';
import {TENANT_QUERY_TABS_ID} from '../../../../store/reducers/tenant/constants';
import {setQueryTab} from '../../../../store/reducers/tenant/tenant';
import type {QueryInHistory} from '../../../../types/store/executeQuery';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {MAX_QUERY_HEIGHT, QUERY_TABLE_SETTINGS} from '../../utils/constants';
import i18n from '../i18n';

import './QueriesHistory.scss';

const b = cn('ydb-queries-history');

const QUERIES_HISTORY_COLUMNS_WIDTH_LS_KEY = 'queriesHistoryTableColumnsWidth';

interface QueriesHistoryProps {
    changeUserInput: (value: {input: string}) => void;
}

function QueriesHistory({changeUserInput}: QueriesHistoryProps) {
    const dispatch = useTypedDispatch();

    const queriesHistory = useTypedSelector(selectQueriesHistory);
    const reversedHistory = [...queriesHistory].reverse();

    const onQueryClick = (query: QueryInHistory) => {
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
            width: 600,
        },
    ];

    return (
        <div className={b()}>
            <ResizeableDataTable
                columnsWidthLSKey={QUERIES_HISTORY_COLUMNS_WIDTH_LS_KEY}
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
