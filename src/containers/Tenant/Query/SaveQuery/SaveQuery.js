import React from 'react';

import {Button, Dialog, DropdownMenu, TextInput} from '@gravity-ui/uikit';
import some from 'lodash/some';

import {setQueryNameToEdit} from '../../../../store/reducers/saveQuery';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';

import './SaveQuery.scss';

const b = cn('kv-save-query');

function SaveQuery({savedQueries, onSaveQuery, saveButtonDisabled}) {
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const [isDialogVisible, setIsDialogVisible] = React.useState(false);
    const [queryName, setQueryName] = React.useState('');
    const [validationError, setValidationError] = React.useState(null);

    const queryNameToEdit = useTypedSelector((state) => state.saveQuery);
    const dispatch = useTypedDispatch();

    const onSaveQueryClick = () => {
        setIsDialogVisible(true);
        dispatch(setQueryNameToEdit(null));
    };

    const onCloseDialog = () => {
        setIsDialogVisible(false);
        setQueryName('');
        setValidationError(null);
    };

    const onQueryNameChange = (value) => {
        setQueryName(value);
        setValidationError(validateQueryName(value));
    };

    const validateQueryName = (value) => {
        if (some(savedQueries, (q) => q.name.toLowerCase() === value.trim().toLowerCase())) {
            return 'This name already exists';
        }
        return null;
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

    const renderSaveButton = (onClick) => {
        return (
            <Button onClick={onClick} disabled={saveButtonDisabled}>
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
            <DropdownMenu items={items} switcher={renderSaveButton()} popupPlacement={['top']} />
        );
    };

    return (
        <React.Fragment>
            {queryNameToEdit ? renderSaveDropdownMenu() : renderSaveButton(onSaveQueryClick)}
            {isDialogVisible && renderDialog()}
        </React.Fragment>
    );
}

export default SaveQuery;
