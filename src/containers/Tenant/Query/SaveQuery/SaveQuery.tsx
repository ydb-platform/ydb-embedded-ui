import React from 'react';

import {Button, Dialog, DropdownMenu, TextInput} from '@gravity-ui/uikit';

import {
    clearQueryNameToEdit,
    selectQueryAction,
    selectQueryName,
    setQueryAction,
} from '../../../../store/reducers/queryActions';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {CtrlCmd, formatShortcut} from '../../../../utils/keyboard';
import {useSaveQuery, useSavedQueries} from '../utils/queryActions';

import i18n from './i18n';

import './SaveQuery.scss';

const b = cn('ydb-save-query');

interface SaveQueryProps {
    isSaveButtonDisabled?: boolean;
}

export function SaveQuery({isSaveButtonDisabled}: SaveQueryProps) {
    const dispatch = useTypedDispatch();
    const queryNameToEdit = useTypedSelector(selectQueryName);

    const saveQuery = useSaveQuery();

    const onSaveQueryClick = () => {
        dispatch(setQueryAction('save'));
        dispatch(clearQueryNameToEdit());
    };

    const onEditQueryClick = () => {
        saveQuery(queryNameToEdit);
        dispatch(clearQueryNameToEdit());
    };

    const renderSaveButton = () => {
        return (
            <Button
                onClick={onSaveQueryClick}
                disabled={isSaveButtonDisabled}
                title={`Save query [${formatShortcut([CtrlCmd, 'S'])}]`}
            >
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
    const saveQuery = useSaveQuery();
    const dispatch = useTypedDispatch();
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const queryAction = useTypedSelector(selectQueryAction);
    const [queryName, setQueryName] = React.useState('');
    const [validationError, setValidationError] = React.useState<string | null>(null);

    const validateQueryName = (value: string) => {
        if (savedQueries.some((q) => q.name.toLowerCase() === value.trim().toLowerCase())) {
            return i18n('error.name-exists');
        }
        return null;
    };

    const onCloseDialog = () => {
        dispatch(setQueryAction('idle'));
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

        saveQuery(queryName);
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
