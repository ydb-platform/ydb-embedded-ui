import React from 'react';

import NiceModal from '@ebay/nice-modal-react';

import {DrawerWrapper} from '../../../../components/Drawer';
import type {DrawerControl} from '../../../../components/Drawer/Drawer';
import {QueryDetails} from '../../../../components/QueryDetails/QueryDetails';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import type {useQueriesHistory} from '../../../../store/reducers/query/hooks';
import {
    selectQueriesHistoryFilter,
    setHistoryCurrentQueryId,
    setQueryHistoryFilter,
} from '../../../../store/reducers/query/query';
import type {QueryInHistory} from '../../../../store/reducers/query/types';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';
import {SAVE_QUERY_DIALOG} from '../SaveQuery/SaveQuery';
import {useOpenExternalQueryInEditor} from '../hooks/useOpenExternalQueryInEditor';
import i18n from '../i18n';
import {getQueryTextTabTitle} from '../utils/queryTabTitles';
import {useSavedQueries} from '../utils/useSavedQueries';

import {getColumns, getQueryInfoItems} from './columns';
import {b} from './shared';

import './QueriesHistory.scss';

const QUERIES_HISTORY_COLUMNS_WIDTH_LS_KEY = 'queriesHistoryTableColumnsWidth';

interface QueriesHistoryProps {
    queriesHistory: ReturnType<typeof useQueriesHistory>;
}

function QueriesHistory({queriesHistory}: QueriesHistoryProps) {
    const dispatch = useTypedDispatch();
    const [showQueryPreview, setShowQueryPreview] = React.useState(false);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const {savedQueries, saveQuery} = useSavedQueries();
    const openExternalQueryInEditor = useOpenExternalQueryInEditor();

    const drawerControls: DrawerControl[] = React.useMemo(() => [{type: 'close'}], []);

    const filter = useTypedSelector(selectQueriesHistoryFilter);

    const onQueryClick = React.useCallback(
        (query: QueryInHistory) => {
            openExternalQueryInEditor({
                title: getQueryTextTabTitle(query.queryText),
                input: query.queryText,
                onAfterOpen: () => {
                    dispatch(setHistoryCurrentQueryId(query.queryId));
                },
            });
        },
        [dispatch, openExternalQueryInEditor],
    );

    const handleSaveQuery = React.useCallback(
        (queryBody: string) => {
            NiceModal.show(SAVE_QUERY_DIALOG, {
                savedQueries,
                onSaveQuery: saveQuery,
                queryBody,
            });
        },
        [savedQueries, saveQuery],
    );

    const handleShowPreview = React.useCallback(
        (query: QueryInHistory, _index?: number, event?: React.MouseEvent<HTMLTableRowElement>) => {
            event?.stopPropagation();
            setShowQueryPreview(true);

            setSelectedId(query.queryId);
        },
        [],
    );

    const onChangeFilter = (value: string) => {
        dispatch(setQueryHistoryFilter(value));
    };

    const columns = React.useMemo(() => {
        return getColumns({
            openInEditor: onQueryClick,
            saveQuery: handleSaveQuery,
        });
    }, [onQueryClick, handleSaveQuery]);

    const handleCloseDrawer = React.useCallback(() => {
        setShowQueryPreview(false);
        setSelectedId(null);
    }, []);

    const selectedQuery = React.useMemo(() => {
        return queriesHistory.filteredHistoryQueries.find((query) => query.queryId === selectedId);
    }, [queriesHistory.filteredHistoryQueries, selectedId]);

    const renderDrawerContent = React.useCallback(
        () =>
            selectedQuery ? (
                <QueryDetails
                    queryText={selectedQuery.queryText}
                    onOpenInEditor={() => onQueryClick(selectedQuery)}
                    infoItems={getQueryInfoItems(selectedQuery)}
                />
            ) : null,
        [onQueryClick, selectedQuery],
    );

    return (
        <div className={b()}>
            <TableWithControlsLayout className={b('table-with-controls')}>
                <TableWithControlsLayout.Controls>
                    <Search
                        value={filter}
                        onChange={onChangeFilter}
                        placeholder={i18n('field_query-text-search')}
                        className={b('search')}
                    />
                </TableWithControlsLayout.Controls>
                <TableWithControlsLayout.Table>
                    <DrawerWrapper
                        isDrawerVisible={showQueryPreview}
                        onCloseDrawer={handleCloseDrawer}
                        renderDrawerContent={renderDrawerContent}
                        drawerId={'query-history-preview'}
                        detectClickOutside
                        isPercentageWidth
                        drawerControls={drawerControls}
                        title={i18n('title_query-history-details')}
                        defaultWidth={50}
                    >
                        <ResizeableDataTable
                            columnsWidthLSKey={QUERIES_HISTORY_COLUMNS_WIDTH_LS_KEY}
                            columns={columns}
                            data={queriesHistory.filteredHistoryQueries}
                            settings={QUERY_TABLE_SETTINGS}
                            emptyDataMessage={i18n(
                                filter
                                    ? 'context_query-history-search-empty'
                                    : 'context_query-history-empty',
                            )}
                            rowClassName={(row) =>
                                b('table-row', {active: row.queryId === selectedId})
                            }
                            onRowClick={handleShowPreview}
                        />
                    </DrawerWrapper>
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </div>
    );
}

export default QueriesHistory;
