import {MouseEvent, useState} from 'react';
import {useDispatch} from 'react-redux';
import block from 'bem-cn-lite';

import {Dialog, Button} from '@gravity-ui/uikit';
import DataTable, {Column} from '@gravity-ui/react-data-table';

import type {SavedQuery} from '../../../../types/store/query';
import {setQueryNameToEdit} from '../../../../store/reducers/saveQuery';
import {setQueryTab} from '../../../../store/reducers/tenant/tenant';
import {TENANT_QUERY_TABS_ID} from '../../../../store/reducers/tenant/constants';

import {TruncatedQuery} from '../../../../components/TruncatedQuery/TruncatedQuery';
import {Icon} from '../../../../components/Icon';

import {MAX_QUERY_HEIGHT, QUERY_TABLE_SETTINGS} from '../../utils/constants';

import i18n from '../i18n';

import './SavedQueries.scss';

const b = block('ydb-saved-queries');

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

interface SavedQueriesProps {
    savedQueries: SavedQuery[];
    changeUserInput: (value: {input: string}) => void;
    onDeleteQuery: (queryName: string) => void;
}

export const SavedQueries = ({savedQueries, changeUserInput, onDeleteQuery}: SavedQueriesProps) => {
    const dispatch = useDispatch();

    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
    const [queryNameToDelete, setQueryNameToDelete] = useState<string>('');

    const closeDeleteDialog = () => {
        setIsDeleteDialogVisible(false);
        setQueryNameToDelete('');
    };

    const onCancelDeleteClick = () => {
        closeDeleteDialog();
    };

    const onConfirmDeleteClick = () => {
        closeDeleteDialog();
        onDeleteQuery(queryNameToDelete);
        setQueryNameToDelete('');
    };

    const onQueryClick = (queryText: string, queryName: string) => {
        changeUserInput({input: queryText});
        dispatch(setQueryNameToEdit(queryName));
        dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
    };

    const onDeleteQueryClick = (queryName: string) => {
        return (event: MouseEvent) => {
            event.stopPropagation();
            setIsDeleteDialogVisible(true);
            setQueryNameToDelete(queryName);
        };
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
                            <Icon name="pencil" viewBox="0 0 24 24" />
                        </Button>
                        <Button view="flat-secondary" onClick={onDeleteQueryClick(query.name)}>
                            <Icon name="trash" viewBox="0 0 24 24" />
                        </Button>
                    </span>
                </div>
            ),
            sortable: false,
        },
    ];

    return (
        <>
            <div className={b()}>
                <DataTable
                    theme="yandex-cloud"
                    columns={columns}
                    data={savedQueries}
                    settings={QUERY_TABLE_SETTINGS}
                    emptyDataMessage={i18n('saved.empty')}
                    rowClassName={() => b('row')}
                    onRowClick={(row) => onQueryClick(row.body, row.name)}
                    initialSortOrder={{
                        columnId: 'name',
                        order: DataTable.ASCENDING,
                    }}
                />
            </div>
            <DeleteDialog
                visible={isDeleteDialogVisible}
                queryName={queryNameToDelete}
                onCancelClick={onCancelDeleteClick}
                onConfirmClick={onConfirmDeleteClick}
            />
        </>
    );
};
