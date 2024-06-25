import React from 'react';

import {Button, Dialog, DropdownMenu, TextInput} from '@gravity-ui/uikit';
import some from 'lodash/some';

import {clearQueryNameToEdit, setQueryNameToEdit} from '../../../../store/reducers/saveQuery';
import type {SavedQuery} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';

import './SaveQuery.scss';

const b = cn('kv-save-query');

interface SaveQueryProps {
    savedQueries: SavedQuery[];
    onSaveQuery: (name: string | null) => void;
    isSaveButtonDisabled: boolean;
}

function SaveQuery({
    savedQueries,
    onSaveQuery,
    isSaveButtonDisabled: saveButtonDisabled,
}: SaveQueryProps) {
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const [isDialogVisible, setIsDialogVisible] = React.useState(false);
    const [queryName, setQueryName] = React.useState('');
    const [validationError, setValidationError] = React.useState<string | null>(null);

    const queryNameToEdit = useTypedSelector((state) => state.saveQuery);
    const dispatch = useTypedDispatch();

    const onSaveQueryClick = () => {
        setIsDialogVisible(true);
        dispatch(clearQueryNameToEdit());
    };

    const onCloseDialog = () => {
        setIsDialogVisible(false);
        setQueryName('');
        setValidationError(null);
    };

    const validateQueryName = (value: string) => {
        if (some(savedQueries, (q) => q.name.toLowerCase() === value.trim().toLowerCase())) {
            return 'This name already exists';
        }
        return null;
    };

    const onQueryNameChange = (value: string) => {
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

    const onEditQueryClick = () => {
        onSaveQuery(queryNameToEdit);
        dispatch(setQueryNameToEdit(null));
    };

    const renderDialog = () => {
        return (
            <Dialog
                open={isDialogVisible}
                hasCloseButton={false}
                size="s"
                onClose={onCloseDialog}
                onEnterKeyDown={onSaveClick}
            >
                <Dialog.Header caption="Save query" />
                <Dialog.Body className={b('dialog-body')}>
                    {singleClusterMode && (
                        <div className={b('dialog-row')}>
                            The query will be saved in your browser
                        </div>
                    )}
                    <div className={b('dialog-row')}>
                        <label htmlFor="queryName" className={b('field-title', 'required')}>
                            Query name
                        </label>
                        <div className={b('control-wrapper')}>
                            <TextInput
                                id="queryName"
                                placeholder="Enter query name"
                                value={queryName}
                                onUpdate={onQueryNameChange}
                                hasClear
                                autoFocus
                            />
                            <span className={b('error')}>{validationError}</span>
                        </div>
                    </div>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonApply="Save"
                    textButtonCancel="Cancel"
                    onClickButtonCancel={onCloseDialog}
                    onClickButtonApply={onSaveClick}
                    propsButtonApply={{
                        disabled: !queryName || Boolean(validationError),
                    }}
                />
            </Dialog>
        );
    };

    const renderSaveButton = () => {
        return (
            <Button onClick={onSaveQueryClick} disabled={saveButtonDisabled}>
                {queryNameToEdit ? 'Edit query' : 'Save query'}
            </Button>
        );
    };

    const renderSaveDropdownMenu = () => {
        const items = [
            {
                action: onEditQueryClick,
                text: 'Edit existing',
            },
            {
                action: onSaveQueryClick,
                text: 'Save as new',
            },
        ];
        return (
            <DropdownMenu
                items={items}
                renderSwitcher={renderSaveButton}
                popupProps={{placement: 'top'}}
            />
        );
    };

    return (
        <React.Fragment>
            {queryNameToEdit ? renderSaveDropdownMenu() : renderSaveButton()}
            {isDialogVisible && renderDialog()}
        </React.Fragment>
    );
}

export default SaveQuery;
