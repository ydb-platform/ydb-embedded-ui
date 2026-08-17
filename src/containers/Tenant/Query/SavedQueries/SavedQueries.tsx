import React from 'react';

import {FontCursor} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {DrawerWrapper} from '../../../../components/Drawer';
import type {DrawerControl} from '../../../../components/Drawer/Drawer';
import {QueryDetails} from '../../../../components/QueryDetails/QueryDetails';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    selectSavedQueriesFilter,
    setSavedQueriesFilter,
} from '../../../../store/reducers/queryActions/queryActions';
import type {SavedQuery} from '../../../../types/store/query';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';
import {useOpenExternalQueryInEditor} from '../hooks/useOpenExternalQueryInEditor';
import i18n from '../i18n';
import {formatSavedQueryUpdatedAt} from '../utils/savedQueries';
import {useSavedQueries} from '../utils/useSavedQueries';

import {RenameSavedQueryDialog} from './RenameSavedQueryDialog';
import {getColumns} from './columns';
import {b} from './shared';

import './SavedQueries.scss';

const SAVED_QUERIES_COLUMNS_WIDTH_LS_KEY = 'savedQueriesTableColumnsWidth';

export const SavedQueries = () => {
    const {savedQueries, filteredSavedQueries, renameSavedQuery} = useSavedQueries();
    const dispatch = useTypedDispatch();
    const filter = useTypedSelector(selectSavedQueriesFilter);
    const openExternalQueryInEditor = useOpenExternalQueryInEditor();
    const [isPreviewVisible, setIsPreviewVisible] = React.useState(false);
    const [selectedQueryName, setSelectedQueryName] = React.useState<string | null>(null);
    const [queryNameToRename, setQueryNameToRename] = React.useState<string | null>(null);

    const handleOpenInEditor = React.useCallback(
        (query: SavedQuery) => {
            openExternalQueryInEditor({
                title: query.name,
                input: query.body,
                savedQueryName: query.name,
            });
        },
        [openExternalQueryInEditor],
    );

    const handleShowPreview = React.useCallback(
        (query: SavedQuery, _index?: number, event?: React.MouseEvent<HTMLTableRowElement>) => {
            event?.stopPropagation();
            setSelectedQueryName(query.name);
            setIsPreviewVisible(true);
        },
        [],
    );

    const handleClosePreview = React.useCallback(() => {
        setIsPreviewVisible(false);
        setSelectedQueryName(null);
    }, []);

    const handleOpenRenameDialog = React.useCallback((queryName: string) => {
        setQueryNameToRename(queryName);
    }, []);

    const handleCloseRenameDialog = React.useCallback(() => {
        setQueryNameToRename(null);
    }, []);

    const handleRenameSavedQuery = React.useCallback(
        (nextName: string) => {
            if (!queryNameToRename || !renameSavedQuery(queryNameToRename, nextName)) {
                return false;
            }

            setSelectedQueryName((currentName) =>
                currentName?.toLowerCase() === queryNameToRename.toLowerCase()
                    ? nextName
                    : currentName,
            );

            return true;
        },
        [queryNameToRename, renameSavedQuery],
    );

    const handleChangeFilter = React.useCallback(
        (value: string) => {
            dispatch(setSavedQueriesFilter(value));
        },
        [dispatch],
    );

    const selectedQuery = React.useMemo(() => {
        return (savedQueries ?? []).find(
            (query) => query.name.toLowerCase() === selectedQueryName?.toLowerCase(),
        );
    }, [savedQueries, selectedQueryName]);

    const drawerInfoItems = React.useMemo(() => {
        if (!selectedQuery) {
            return [];
        }

        return [
            {
                name: i18n('field_saved-query-edited-at'),
                content: formatSavedQueryUpdatedAt(selectedQuery.updatedAt),
            },
        ];
    }, [selectedQuery]);

    const drawerControls = React.useMemo<DrawerControl[]>(() => {
        const controls: DrawerControl[] = [];

        if (selectedQuery) {
            controls.push({
                type: 'custom',
                key: 'rename',
                node: (
                    <ActionTooltip title={i18n('action_rename-query')}>
                        <Button
                            qa="rename-saved-query-button"
                            view="flat"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleOpenRenameDialog(selectedQuery.name);
                            }}
                            aria-label={i18n('action_rename-query')}
                        >
                            <Icon data={FontCursor} />
                        </Button>
                    </ActionTooltip>
                ),
            });
        }

        controls.push({type: 'close'});
        return controls;
    }, [handleOpenRenameDialog, selectedQuery]);

    const renderDrawerContent = React.useCallback(() => {
        return selectedQuery ? (
            <QueryDetails
                queryText={selectedQuery.body}
                onOpenInEditor={() => handleOpenInEditor(selectedQuery)}
                infoItems={drawerInfoItems}
            />
        ) : null;
    }, [drawerInfoItems, handleOpenInEditor, selectedQuery]);

    const columns = React.useMemo(() => {
        return getColumns({
            openInEditor: handleOpenInEditor,
            renameQuery: handleOpenRenameDialog,
        });
    }, [handleOpenInEditor, handleOpenRenameDialog]);

    return (
        <React.Fragment>
            <div className={b()}>
                <TableWithControlsLayout className={b('table-with-controls')}>
                    <TableWithControlsLayout.Controls>
                        <Search
                            value={filter}
                            onChange={handleChangeFilter}
                            placeholder={i18n('field_saved-query-search')}
                            className={b('search')}
                        />
                    </TableWithControlsLayout.Controls>
                    <TableWithControlsLayout.Table>
                        <DrawerWrapper
                            isDrawerVisible={isPreviewVisible}
                            onCloseDrawer={handleClosePreview}
                            renderDrawerContent={renderDrawerContent}
                            drawerId="saved-query-preview"
                            detectClickOutside={!queryNameToRename}
                            isPercentageWidth
                            drawerControls={drawerControls}
                            title={selectedQuery?.name || EMPTY_DATA_PLACEHOLDER}
                            defaultWidth={50}
                        >
                            <ResizeableDataTable
                                columnsWidthLSKey={SAVED_QUERIES_COLUMNS_WIDTH_LS_KEY}
                                columns={columns}
                                data={filteredSavedQueries}
                                settings={QUERY_TABLE_SETTINGS}
                                emptyDataMessage={i18n(
                                    filter
                                        ? 'context_query-history-search-empty'
                                        : 'context_saved-queries-empty',
                                )}
                                rowClassName={(row) =>
                                    b('row', {
                                        active:
                                            row.name.toLowerCase() ===
                                            selectedQueryName?.toLowerCase(),
                                    })
                                }
                                onRowClick={handleShowPreview}
                            />
                        </DrawerWrapper>
                    </TableWithControlsLayout.Table>
                </TableWithControlsLayout>
            </div>
            {queryNameToRename && (
                <RenameSavedQueryDialog
                    open
                    currentName={queryNameToRename}
                    savedQueries={savedQueries ?? []}
                    onClose={handleCloseRenameDialog}
                    onRename={handleRenameSavedQuery}
                />
            )}
        </React.Fragment>
    );
};
