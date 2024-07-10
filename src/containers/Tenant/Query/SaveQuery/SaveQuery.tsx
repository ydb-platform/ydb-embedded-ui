import React from 'react';

import {Button, Dialog, DropdownMenu, TextInput} from '@gravity-ui/uikit';

import {
    clearQueryNameToEdit,
    saveQuery,
    selectQueryAction,
    selectQueryName,
    setQueryAction,
} from '../../../../store/reducers/queryActions/queryActions';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {useSavedQueries} from '../utils/useSavedQueries';

import i18n from './i18n';

import './SaveQuery.scss';

const b = cn('ydb-save-query');

interface SaveQueryProps {
    isSaveButtonDisabled?: boolean;
}

export function SaveQuery({isSaveButtonDisabled}: SaveQueryProps) {
    const dispatch = useTypedDispatch();
    const queryNameToEdit = useTypedSelector(selectQueryName);

    const onSaveQueryClick = () => {
        dispatch(setQueryAction('save'));
        dispatch(clearQueryNameToEdit());
    };

    const onEditQueryClick = () => {
        dispatch(saveQuery(queryNameToEdit));
        dispatch(clearQueryNameToEdit());
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

export function SaveQueryDialog() {
    const savedQueries = useSavedQueries();
    const dispatch = useTypedDispatch();
    const queryAction = useTypedSelector(selectQueryAction);
    const [queryName, setQueryName] = React.useState('');
    const [validationError, setValidationError] = React.useState<string>();

    const validateQueryName = (value: string) => {
        if (!value) {
            return i18n('error.name-not-empty');
        }
        if (savedQueries.some((q) => q.name.toLowerCase() === value.trim().toLowerCase())) {
            return i18n('error.name-exists');
        }
        return undefined;
    };

    const onCloseDialog = () => {
        dispatch(setQueryAction('idle'));
        setQueryName('');
        setValidationError(undefined);
    };

    const handleQueryNameChange = (value: string) => {
        setQueryName(value);
        setValidationError(undefined);
    };

    const onSaveClick = () => {
        dispatch(saveQuery(queryName));
        onCloseDialog();
    };

    return (
        <Dialog
            open={queryAction === 'save'}
            hasCloseButton={false}
            size="s"
            onClose={onCloseDialog}
        >
            <Dialog.Header caption={i18n('action.save')} />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const validationError = validateQueryName(queryName);
                    setValidationError(validationError);
                    if (!validationError) {
                        onSaveClick();
                    }
                }}
            >
                <Dialog.Body className={b('dialog-body')}>
                    <div className={b('dialog-row')}>{i18n('description')}</div>
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
                    onClickButtonCancel={onCloseDialog}
                    propsButtonApply={{
                        type: 'submit',
                    }}
                />
            </form>
        </Dialog>
    );
}
