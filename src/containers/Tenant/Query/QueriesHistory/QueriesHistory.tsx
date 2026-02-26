import React from 'react';

import {isEqual} from 'lodash';

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
    setIsDirty,
    setQueryHistoryFilter,
} from '../../../../store/reducers/query/query';
import type {EnhancedQueryInHistory, QueryInHistory} from '../../../../store/reducers/query/types';
import {TENANT_QUERY_TABS_ID} from '../../../../store/reducers/tenant/constants';
import {setQueryTab} from '../../../../store/reducers/tenant/tenant';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {useChangeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';
import i18n from '../i18n';

import {getColumns, getQueryInfoItems} from './columns';
import {b} from './shared';

import './QueriesHistory.scss';

const QUERIES_HISTORY_COLUMNS_WIDTH_LS_KEY = 'queriesHistoryTableColumnsWidth';

interface QueriesHistoryProps {
    changeUserInput: (value: {input: string}) => void;
    queriesHistory: ReturnType<typeof useQueriesHistory>;
}

function QueriesHistory({changeUserInput, queriesHistory}: QueriesHistoryProps) {
    const dispatch = useTypedDispatch();
    const [showQueryPreview, setShowQueryPreview] = React.useState(false);
    const [selectedRow, setSelectedRow] = React.useState<EnhancedQueryInHistory | null>(null);

    const sortedHistory = React.useMemo(() => {
        return queriesHistory.filteredHistoryQueries.toSorted((a, b) => {
            if (!a.startTime && !b.startTime) {
                return 0;
            }
            if (!a.startTime) {
                return 1;
            }
            if (!b.startTime) {
                return -1;
            }
            return b.startTime - a.startTime;
        });
    }, [queriesHistory.filteredHistoryQueries]);

    const drawerControls: DrawerControl[] = React.useMemo(() => [{type: 'close'}], []);

    const filter = useTypedSelector(selectQueriesHistoryFilter);

    const applyQueryClick = React.useCallback(
        (query: QueryInHistory) => {
            changeUserInput({input: query.queryText});
            dispatch(setIsDirty(false));
            dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
            dispatch(setHistoryCurrentQueryId(query.queryId));
        },
        [changeUserInput, dispatch],
    );

    const handleShowPreview = React.useCallback(
        (query: QueryInHistory, _index?: number, event?: React.MouseEvent<HTMLTableRowElement>) => {
            event?.stopPropagation();
            setShowQueryPreview(true);

            setSelectedRow(query);
        },
        [],
    );

    const onQueryClick = useChangeInputWithConfirmation(applyQueryClick);

    const onChangeFilter = (value: string) => {
        dispatch(setQueryHistoryFilter(value));
    };

    const columns = React.useMemo(() => {
        return getColumns({
            openInEditor: onQueryClick,
        });
    }, [onQueryClick]);

    const handleCloseDrawer = React.useCallback(() => {
        setShowQueryPreview(false);
    }, []);

    const renderDrawerContent = React.useCallback(
        () =>
            selectedRow ? (
                <QueryDetails
                    queryText={selectedRow?.queryText}
                    onOpenInEditor={() => applyQueryClick(selectedRow)}
                    infoItems={getQueryInfoItems(selectedRow)}
                />
            ) : null,
        [selectedRow, applyQueryClick],
    );

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
                <DrawerWrapper
                    isDrawerVisible={showQueryPreview}
                    onCloseDrawer={handleCloseDrawer}
                    renderDrawerContent={renderDrawerContent}
                    drawerId={'query-history-preview'}
                    detectClickOutside
                    isPercentageWidth
                    drawerControls={drawerControls}
                    title={i18n('title_query-details')}
                    defaultWidth={50}
                >
                    <ResizeableDataTable
                        columnsWidthLSKey={QUERIES_HISTORY_COLUMNS_WIDTH_LS_KEY}
                        columns={columns}
                        data={sortedHistory}
                        settings={QUERY_TABLE_SETTINGS}
                        emptyDataMessage={i18n(filter ? 'history.empty-search' : 'history.empty')}
                        rowClassName={(row) => b('table-row', {active: isEqual(row, selectedRow)})}
                        onRowClick={handleShowPreview}
                    />
                </DrawerWrapper>
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}

export default QueriesHistory;
