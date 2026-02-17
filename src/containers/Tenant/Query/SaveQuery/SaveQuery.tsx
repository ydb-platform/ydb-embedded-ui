import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import type {ButtonButtonProps, ButtonProps} from '@gravity-ui/uikit';
import {Button, Dialog, DropdownMenu, TextInput} from '@gravity-ui/uikit';

import {selectActiveTab, setIsDirty} from '../../../../store/reducers/query/query';
import {
    clearQueryNameToEdit,
    selectQueryName,
    setQueryAction,
} from '../../../../store/reducers/queryActions/queryActions';
import type {SavedQuery} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {useSavedQueries} from '../utils/useSavedQueries';

import i18n from './i18n';

import './SaveQuery.scss';

const b = cn('ydb-save-query');

export const SAVE_QUERY_DIALOG = 'save-query-dialog';

interface SaveQueryProps {
    buttonProps?: ButtonProps;
}

function useSaveQueryHandler(dialogProps?: SaveQueryDialogCommonProps) {
    const dispatch = useTypedDispatch();
    const {savedQueries, saveQuery} = useSavedQueries();
    const activeTab = useTypedSelector(selectActiveTab);

    const onSaveQueryClick = React.useCallback(() => {
        const computedDefaultQueryName = activeTab?.isTitleUserDefined
            ? activeTab.title
            : undefined;
        NiceModal.show(SAVE_QUERY_DIALOG, {
            ...dialogProps,
            defaultQueryName: dialogProps?.defaultQueryName ?? computedDefaultQueryName,
            savedQueries,
            onSaveQuery: saveQuery,
        });
        dispatch(clearQueryNameToEdit());
    }, [
        activeTab?.isTitleUserDefined,
        activeTab?.title,
        dispatch,
        dialogProps,
        savedQueries,
        saveQuery,
    ]);

    return onSaveQueryClick;
}

interface SaveQueryButtonProps extends ButtonButtonProps {
    dialogProps?: SaveQueryDialogCommonProps;
}

export function SaveQueryButton({dialogProps, ...buttonProps}: SaveQueryButtonProps) {
    const onSaveQueryClick = useSaveQueryHandler(dialogProps);

    return (
        <Button onClick={onSaveQueryClick} {...buttonProps}>
            {i18n('action.save')}
        </Button>
    );
}

export function SaveQuery({buttonProps = {}}: SaveQueryProps) {
    const dispatch = useTypedDispatch();
    const queryNameToEdit = useTypedSelector(selectQueryName);
    const onSaveQueryClick = useSaveQueryHandler();

    const {saveQuery} = useSavedQueries();

    const onEditQueryClick = () => {
        saveQuery(queryNameToEdit);
        dispatch(setIsDirty(false));
        dispatch(clearQueryNameToEdit());
    };

    const renderSaveDropdownMenu = () => {
        const items = [
            {
                action: onEditQueryClick,
                text: i18n('action.edit-existing'),
            },
            {
                action: onSaveQueryClick,
                text: i18n('action.save-as-new'),
            },
        ];
        return (
            <DropdownMenu
                items={items}
                renderSwitcher={(props) => (
                    <Button {...props} {...buttonProps}>
                        {i18n('action.edit')}
                    </Button>
                )}
                popupProps={{placement: 'top'}}
            />
        );
    };

    return queryNameToEdit ? renderSaveDropdownMenu() : <SaveQueryButton />;
}

interface SaveQueryDialogCommonProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
    defaultQueryName?: string;
}

interface SaveQueryDialogProps extends SaveQueryDialogCommonProps {
    open: boolean;
    savedQueries?: SavedQuery[];
    onSaveQuery: (name: string | null) => void;
}

function SaveQueryDialog({
    onSuccess,
    onCancel,
    onClose,
    defaultQueryName,
    open,
    savedQueries,
    onSaveQuery,
}: SaveQueryDialogProps) {
    const dispatch = useTypedDispatch();
    const [queryName, setQueryName] = React.useState(defaultQueryName ?? '');
    const [validationError, setValidationError] = React.useState<string>();

    const validateQueryName = (value: string) => {
        if (!value) {
            return i18n('error.name-not-empty');
        }
        if (savedQueries?.some((q) => q.name.toLowerCase() === value.trim().toLowerCase())) {
            return i18n('error.name-exists');
        }
        return undefined;
    };

    const onCloseDialog = () => {
        dispatch(setQueryAction('idle'));
        setQueryName('');
        setValidationError(undefined);
        onClose?.();
    };

    const onCloseWithoutSave = () => {
        onCancel?.();
        onCloseDialog();
    };

    const handleQueryNameChange = (value: string) => {
        setQueryName(value);
        setValidationError(undefined);
    };

    const onSaveClick = () => {
        onSaveQuery(queryName);
        dispatch(setIsDirty(false));
        onCloseDialog();
        onSuccess?.();
    };

    return (
        <Dialog open={open} hasCloseButton={true} size="s" onClose={onCloseWithoutSave}>
            <Dialog.Header caption={i18n('action.save')} />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const nextValidationError = validateQueryName(queryName);
                    setValidationError(nextValidationError);
                    if (!nextValidationError) {
                        onSaveClick();
                    }
                }}
            >
                <Dialog.Body className={b('dialog-body')}>
                    <div className={b('dialog-row')}>{i18n('description')}</div>
                    <div className={b('dialog-row')}>
                        <div className={b('control-wrapper')}>
                            <TextInput
                                id="queryName"
                                aria-label={i18n('input-label')}
                                placeholder={i18n('input-placeholder')}
                                value={queryName}
                                onUpdate={handleQueryNameChange}
                                hasClear
                                autoFocus
                                autoComplete={false}
                                validationState={validationError ? 'invalid' : undefined}
                                errorMessage={validationError}
                            />
                        </div>
                    </div>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonApply={i18n('button-apply')}
                    textButtonCancel={i18n('button-cancel')}
                    onClickButtonCancel={onCloseWithoutSave}
                    propsButtonApply={{
                        type: 'submit',
                    }}
                />
            </form>
        </Dialog>
    );
}

export const SaveQueryDialogNiceModal = NiceModal.create((props: SaveQueryDialogProps) => {
    const modal = NiceModal.useModal();

    const handleClose = () => {
        modal.hide();
        modal.remove();
    };

    return (
        <SaveQueryDialog
            {...props}
            onClose={() => {
                props.onClose?.();
                handleClose();
            }}
            open={modal.visible}
        />
    );
});

NiceModal.register(SAVE_QUERY_DIALOG, SaveQueryDialogNiceModal);
