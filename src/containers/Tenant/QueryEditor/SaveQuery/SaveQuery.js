import React, {useState} from 'react';
import _ from 'lodash';
import cn from 'bem-cn-lite';
import {useDispatch, useSelector} from 'react-redux';
import {Dialog, DropdownMenu, TextInput, Button} from '@yandex-cloud/uikit';

import {setQueryNameToEdit} from '../../../../store/reducers/saveQuery';

import './SaveQuery.scss';

const b = cn('kv-save-query');

function SaveQuery({savedQueries, onSaveQuery, saveButtonDisabled}) {
    const singleClusterMode = useSelector((state) => state.singleClusterMode);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [queryName, setQueryName] = useState('');
    const [validationError, setValidationError] = useState(null);

    const queryNameToEdit = useSelector((state) => state.saveQuery);
    const dispatch = useDispatch();

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
        if (_.some(savedQueries, (q) => q.name.toLowerCase() === value.trim().toLowerCase())) {
            return 'This name already exists';
        }
        return null;
    };

    const onSaveClick = () => {
        if (queryName && !validationError) {
            onSaveQuery(queryName);
        }
        onCloseDialog();
    };

    const onEditQueryClick = () => {
        onSaveQuery(queryNameToEdit);
        dispatch(setQueryNameToEdit(null));
    };

    const renderDialog = () => {
        return (
            <Dialog open={isDialogVisible} hasCloseButton={false} size="s" onClose={onCloseDialog}>
                <Dialog.Header caption="Save query" />
                <Dialog.Body className={b('dialog-body')}>
                    {singleClusterMode && (
                        <div className={b('dialog-row')}>
                            The query will be saved in your browser
                        </div>
                    )}
                    <div className={b('dialog-row')}>
                        <label
                            htmlFor="queryName"
                            className={b('field-title', 'required')}
                        >
                            Query name
                        </label>
                        <div className={b('control-wrapper')}>
                            <TextInput
                                id="queryName"
                                placeholder="Enter query name"
                                text={queryName}
                                onUpdate={onQueryNameChange}
                                hasClear
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
                Save query
            </Button>
        );
    };

    const renderSaveDropdownMenu = () => {
        const items = [
            {
                action: onSaveQueryClick,
                text: 'Save as new',
            },
            {
                action: onEditQueryClick,
                text: 'Edit existing',
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
