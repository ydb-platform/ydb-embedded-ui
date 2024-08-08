import type {Column} from '@gravity-ui/react-data-table';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {TruncatedQuery} from '../../../../components/TruncatedQuery/TruncatedQuery';
import {
    selectQueriesHistory,
    selectQueriesHistoryFilter,
    setQueryHistoryFilter,
} from '../../../../store/reducers/executeQuery';
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
    const filter = useTypedSelector(selectQueriesHistoryFilter);
    const reversedHistory = [...queriesHistory].reverse();

    const onQueryClick = (query: QueryInHistory) => {
        changeUserInput({input: query.queryText});
        dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
    };

    const onChangeFilter = (value: string) => {
        dispatch(setQueryHistoryFilter(value));
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
        <TableWithControlsLayout className={b()}>
            <TableWithControlsLayout.Controls>
                <Search
                    value={filter}
                    onChange={onChangeFilter}
                    placeholder={i18n('filter.text.placeholder')}
                    className={b('search')}
                />
            </TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table>
                <ResizeableDataTable
                    columnsWidthLSKey={QUERIES_HISTORY_COLUMNS_WIDTH_LS_KEY}
                    columns={columns}
                    data={reversedHistory}
                    settings={QUERY_TABLE_SETTINGS}
                    emptyDataMessage={i18n(filter ? 'history.empty-search' : 'history.empty')}
                    onRowClick={(row) => onQueryClick(row)}
                    rowClassName={() => b('table-row')}
                />
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}

export default QueriesHistory;
