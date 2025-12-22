import React from 'react';

import {Pencil, TrashBin} from '@gravity-ui/icons';
import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {Button, Dialog, Icon} from '@gravity-ui/uikit';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../../../components/Search';
import {TableWithControlsLayout} from '../../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {TruncatedQuery} from '../../../../components/TruncatedQuery/TruncatedQuery';
import {setIsDirty} from '../../../../store/reducers/query/query';
import {
    selectSavedQueriesFilter,
    setQueryNameToEdit,
    setSavedQueriesFilter,
} from '../../../../store/reducers/queryActions/queryActions';
import {TENANT_QUERY_TABS_ID} from '../../../../store/reducers/tenant/constants';
import {setQueryTab} from '../../../../store/reducers/tenant/tenant';
import type {SavedQuery} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {useChangeInputWithConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {MAX_QUERY_HEIGHT, QUERY_TABLE_SETTINGS} from '../../utils/constants';
import i18n from '../i18n';
import {useSavedQueries} from '../utils/useSavedQueries';

import './SavedQueries.scss';

const b = cn('ydb-saved-queries');

interface DeleteDialogProps {
    visible: boolean;
    queryName: string;
    onCancelClick: VoidFunction;
    onConfirmClick: VoidFunction;
}

const DeleteDialog = ({visible, queryName, onCancelClick, onConfirmClick}: DeleteDialogProps) => {
    return (
        <Dialog
            open={visible}
            hasCloseButton={false}
            size="s"
            onClose={onCancelClick}
            onEnterKeyDown={onConfirmClick}
        >
            <Dialog.Header caption={i18n('delete-dialog.header')} />
            <Dialog.Body className={b('dialog-body')}>
                {i18n('delete-dialog.question')}
                <span className={b('dialog-query-name')}>{` ${queryName}?`}</span>
            </Dialog.Body>
            <Dialog.Footer
                textButtonApply={i18n('delete-dialog.delete')}
                textButtonCancel={i18n('delete-dialog.cancel')}
                onClickButtonCancel={onCancelClick}
                onClickButtonApply={onConfirmClick}
            />
        </Dialog>
    );
};

const SAVED_QUERIES_COLUMNS_WIDTH_LS_KEY = 'savedQueriesTableColumnsWidth';

interface SavedQueriesProps {
    changeUserInput: (value: {input: string}) => void;
}

export const SavedQueries = ({changeUserInput}: SavedQueriesProps) => {
    const {filteredSavedQueries, deleteSavedQuery} = useSavedQueries();
    const dispatch = useTypedDispatch();
    const filter = useTypedSelector(selectSavedQueriesFilter);

    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = React.useState(false);
    const [queryNameToDelete, setQueryNameToDelete] = React.useState<string>('');

    const closeDeleteDialog = () => {
        setIsDeleteDialogVisible(false);
        setQueryNameToDelete('');
    };

    const onCancelDeleteClick = () => {
        closeDeleteDialog();
    };

    const onConfirmDeleteClick = () => {
        closeDeleteDialog();
        deleteSavedQuery(queryNameToDelete);
        setQueryNameToDelete('');
    };

    const applyQueryClick = React.useCallback(
        ({queryText, queryName}: {queryText: string; queryName: string}) => {
            changeUserInput({input: queryText});
            dispatch(setIsDirty(false));
            dispatch(setQueryNameToEdit(queryName));
            dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
        },
        [changeUserInput, dispatch],
    );

    const onQueryClick = useChangeInputWithConfirmation(applyQueryClick);

    const onDeleteQueryClick = (queryName: string) => {
        return (event: React.MouseEvent) => {
            event.stopPropagation();
            setIsDeleteDialogVisible(true);
            setQueryNameToDelete(queryName);
        };
    };

    const onChangeFilter = (value: string) => {
        dispatch(setSavedQueriesFilter(value));
    };

    const columns: Column<SavedQuery>[] = [
        {
            name: 'name',
            header: 'Name',
            render: ({row: query}) => <div className={b('query-name')}>{query.name}</div>,
            width: 200,
        },
        {
            name: 'body',
            header: 'Query Text',
            render: ({row: query}) => (
                <div className={b('query')}>
                    <div className={b('query-body')}>
                        <TruncatedQuery value={query.body} maxQueryHeight={MAX_QUERY_HEIGHT} />
                    </div>
                    <span className={b('controls')}>
                        <Button view="flat-secondary">
                            <Icon data={Pencil} />
                        </Button>
                        <Button view="flat-secondary" onClick={onDeleteQueryClick(query.name)}>
                            <Icon data={TrashBin} />
                        </Button>
                    </span>
                </div>
            ),
            sortable: false,
            resizeMinWidth: 650,
        },
    ];

    return (
        <React.Fragment>
            <TableWithControlsLayout className={b()}>
                <TableWithControlsLayout.Controls>
                    <Search
                        onChange={onChangeFilter}
                        placeholder={i18n('filter.text.placeholder')}
                        className={b('search')}
                    />
                </TableWithControlsLayout.Controls>
                <TableWithControlsLayout.Table>
                    <ResizeableDataTable
                        columnsWidthLSKey={SAVED_QUERIES_COLUMNS_WIDTH_LS_KEY}
                        columns={columns}
                        data={filteredSavedQueries}
                        settings={QUERY_TABLE_SETTINGS}
                        emptyDataMessage={i18n(filter ? 'history.empty-search' : 'saved.empty')}
                        rowClassName={() => b('row')}
                        onRowClick={(row) =>
                            onQueryClick({
                                queryText: row.body,
                                queryName: row.name,
                            })
                        }
                        initialSortOrder={{
                            columnId: 'name',
                            order: DataTable.ASCENDING,
                        }}
                    />
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
            <DeleteDialog
                visible={isDeleteDialogVisible}
                queryName={queryNameToDelete}
                onCancelClick={onCancelDeleteClick}
                onConfirmClick={onConfirmDeleteClick}
            />
        </React.Fragment>
    );
};
