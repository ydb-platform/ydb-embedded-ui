import React from 'react';

import {Button, Dialog, DropdownMenu, TextInput} from '@gravity-ui/uikit';

import {clearQueryNameToEdit, setQueryNameToEdit} from '../../../../store/reducers/saveQuery';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {useQueryAction, useSavedQueries, useSetQueryAction} from '../QueryContext';

import i18n from './i18n';

import './SaveQuery.scss';

const b = cn('ydb-save-query');

interface SaveQueryProps {
    onSaveQuery: (name: string | null) => void;
    isSaveButtonDisabled?: boolean;
}

export function SaveQuery({onSaveQuery, isSaveButtonDisabled}: SaveQueryProps) {
    const setQueryAction = useSetQueryAction();
    const queryNameToEdit = useTypedSelector((state) => state.saveQuery);
    const dispatch = useTypedDispatch();

    const onSaveQueryClick = () => {
        setQueryAction('save');
        dispatch(clearQueryNameToEdit());
    };

    const onEditQueryClick = () => {
        onSaveQuery(queryNameToEdit);
        dispatch(setQueryNameToEdit(null));
    };

    const renderSaveButton = () => {
        return (
            <Button onClick={onSaveQueryClick} disabled={isSaveButtonDisabled}>
                {i18n('action.save')}
            </Button>
        );
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
                    <Button {...props} disabled={isSaveButtonDisabled}>
                        {i18n('action.edit')}
                    </Button>
                )}
                popupProps={{placement: 'top'}}
            />
        );
    };

    return queryNameToEdit ? renderSaveDropdownMenu() : renderSaveButton();
}

interface SaveQueryDialogProps {
    onSaveQuery: (name: string | null) => void;
}

export function SaveQueryDialog({onSaveQuery}: SaveQueryDialogProps) {
    const savedQueries = useSavedQueries();
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const queryAction = useQueryAction();
    const setQueryAction = useSetQueryAction();
    const [queryName, setQueryName] = React.useState('');
    const [validationError, setValidationError] = React.useState<string | null>(null);

    const validateQueryName = (value: string) => {
        if (savedQueries.some((q) => q.name.toLowerCase() === value.trim().toLowerCase())) {
            return i18n('error.name-exists');
        }
        return null;
    };

    const onCloseDialog = () => {
        setQueryAction('idle');
        setQueryName('');
        setValidationError(null);
    };

    const handleQueryNameChange = (value: string) => {
        setQueryName(value);
        setValidationError(validateQueryName(value));
    };

    const onSaveClick = () => {
        if (!queryName || validationError) {
            return;
        }

        onSaveQuery(queryName);
        onCloseDialog();
    };

    return (
        <Dialog
            open={queryAction === 'save'}
            hasCloseButton={false}
            size="s"
            onClose={onCloseDialog}
            onEnterKeyDown={onSaveClick}
        >
            <Dialog.Header caption={i18n('action.save')} />
            <Dialog.Body className={b('dialog-body')}>
                {singleClusterMode && <div className={b('dialog-row')}>{i18n('description')}</div>}
                <div className={b('dialog-row')}>
                    <label htmlFor="queryName" className={b('field-title', 'required')}>
                        {i18n('input-label')}
                    </label>
                    <div className={b('control-wrapper')}>
                        <TextInput
                            id="queryName"
                            placeholder={i18n('input-placeholder')}
                            value={queryName}
                            onUpdate={handleQueryNameChange}
                            hasClear
                            autoFocus
                            error={Boolean(validationError)}
                            autoComplete={false}
                        />
                        <span className={b('error')}>{validationError}</span>
                    </div>
                </div>
            </Dialog.Body>
            <Dialog.Footer
                textButtonApply={i18n('button-apply')}
                textButtonCancel={i18n('button-cancel')}
                onClickButtonCancel={onCloseDialog}
                onClickButtonApply={onSaveClick}
                propsButtonApply={{
                    disabled: !queryName || Boolean(validationError),
                }}
            />
        </Dialog>
    );
}
