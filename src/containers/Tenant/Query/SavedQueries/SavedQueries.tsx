import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import {FontCursor, TrashBin} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {CONFIRMATION_DIALOG} from '../../../../components/ConfirmationDialog/ConfirmationDialog';
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
import {BRAND_BUTTON_CLASS, EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {sortByTimestampDescending} from '../../../../utils/sortByTimestamp';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';
import {useOpenExternalQueryInEditor} from '../hooks/useOpenExternalQueryInEditor';
import i18n from '../i18n';
import {filterSavedQueries, formatSavedQueryUpdatedAt} from '../utils/savedQueries';
import {useSavedQueries} from '../utils/useSavedQueries';

import {RenameSavedQueryDialog} from './RenameSavedQueryDialog';
import {getColumns} from './columns';
import {b} from './shared';

import './SavedQueries.scss';

const SAVED_QUERIES_COLUMNS_WIDTH_LS_KEY = 'savedQueriesTableColumnsWidth';

export const SavedQueries = () => {
    const {savedQueries, deleteSavedQuery, renameSavedQuery} = useSavedQueries();
    const dispatch = useTypedDispatch();
    const filter = useTypedSelector(selectSavedQueriesFilter);
    const openExternalQueryInEditor = useOpenExternalQueryInEditor();
    const [isPreviewVisible, setIsPreviewVisible] = React.useState(false);
    const [selectedQueryName, setSelectedQueryName] = React.useState<string | null>(null);
    const [queryNameToDelete, setQueryNameToDelete] = React.useState<string | null>(null);
    const [queryNameToRename, setQueryNameToRename] = React.useState<string | null>(null);

    const sortedSavedQueries = React.useMemo(() => {
        return sortByTimestampDescending(savedQueries ?? [], (query) => query.updatedAt);
    }, [savedQueries]);

    const filteredSavedQueries = React.useMemo(() => {
        return filterSavedQueries(sortedSavedQueries, filter);
    }, [filter, sortedSavedQueries]);

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

    const handleCloseDeleteDialog = React.useCallback(() => {
        setQueryNameToDelete(null);
    }, []);

    const handleDeleteSavedQuery = React.useCallback(
        (queryName: string) => {
            deleteSavedQuery(queryName);
            if (selectedQueryName?.toLowerCase() === queryName.toLowerCase()) {
                handleClosePreview();
            }
            setQueryNameToDelete(null);
        },
        [deleteSavedQuery, handleClosePreview, selectedQueryName],
    );

    const handleOpenDeleteDialog = React.useCallback(
        (queryName: string) => {
            setQueryNameToDelete(queryName);
            NiceModal.show(CONFIRMATION_DIALOG, {
                id: CONFIRMATION_DIALOG,
                caption: i18n('title_delete-query'),
                children: (
                    <React.Fragment>
                        {i18n('confirm_delete-query')}
                        <span className={b('dialog-query-name')}>{` ${queryName}?`}</span>
                    </React.Fragment>
                ),
                textButtonApply: i18n('action_delete-query'),
                textButtonCancel: i18n('action_cancel'),
                buttonApplyView: 'action',
                propsButtonApply: {className: BRAND_BUTTON_CLASS},
                confirmOnEnter: true,
                onConfirm: () => handleDeleteSavedQuery(queryName),
                onClose: handleCloseDeleteDialog,
            });
        },
        [handleCloseDeleteDialog, handleDeleteSavedQuery],
    );

    const handleRenameSavedQuery = React.useCallback(
        (nextName: string) => {
            if (!queryNameToRename) {
                return 'not-found' as const;
            }

            const result = renameSavedQuery(queryNameToRename, nextName);
            if (result !== 'renamed') {
                return result;
            }

            setSelectedQueryName((currentName) =>
                currentName?.toLowerCase() === queryNameToRename.toLowerCase()
                    ? nextName
                    : currentName,
            );

            return result;
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
            controls.push({
                type: 'custom',
                key: 'delete',
                node: (
                    <ActionTooltip title={i18n('action_delete-query')}>
                        <Button
                            qa="delete-saved-query-button"
                            view="flat"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleOpenDeleteDialog(selectedQuery.name);
                            }}
                            aria-label={i18n('action_delete-query')}
                        >
                            <Icon data={TrashBin} />
                        </Button>
                    </ActionTooltip>
                ),
            });
        }

        controls.push({type: 'close'});
        return controls;
    }, [handleOpenDeleteDialog, handleOpenRenameDialog, selectedQuery]);

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
            deleteQuery: handleOpenDeleteDialog,
            openInEditor: handleOpenInEditor,
            renameQuery: handleOpenRenameDialog,
        });
    }, [handleOpenDeleteDialog, handleOpenInEditor, handleOpenRenameDialog]);

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
                            detectClickOutside={!queryNameToDelete && !queryNameToRename}
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
                    onClose={handleCloseRenameDialog}
                    onRename={handleRenameSavedQuery}
                />
            )}
        </React.Fragment>
    );
};
