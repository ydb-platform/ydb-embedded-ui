import React, {useState, useRef} from 'react';
import _ from 'lodash';
import cn from 'bem-cn-lite';
import {useDispatch, useSelector} from 'react-redux';
import {Dialog, DropdownMenu, Popup, TextInput, Button} from '@yandex-cloud/uikit';

import Icon from '../../../../components/Icon/Icon';
import {setQueryNameToEdit} from '../../../../store/reducers/saveQuery';

import './SaveQuery.scss';

const b = cn('kv-save-query');

const EMBEDDED_VERSION_WARNING =
    'Please be aware: after cookies delete your saved queries will be lost.';

function SaveQuery({savedQueries, onSaveQuery, saveButtonDisabled}) {
    const singleClusterMode = useSelector((state) => state.singleClusterMode);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [isEmbeddedWarningVisible, setIsEmbeddedWarningVisible] = useState(false);
    const [queryName, setQueryName] = useState('');
    const [validationError, setValidationError] = useState(null);

    const queryNameToEdit = useSelector((state) => state.saveQuery);
    const dispatch = useDispatch();

    const warningRef = useRef();

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

    const onEmbeddedWarningOpen = () => {
        setIsEmbeddedWarningVisible(true);
    };
    const onEmbeddedWarningClose = () => {
        setIsEmbeddedWarningVisible(false);
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
                    <span className={b('field-title', 'required')}>Query name</span>
                    <div className={b('control-wrapper')}>
                        <TextInput
                            placeholder="Enter query name"
                            text={queryName}
                            onUpdate={onQueryNameChange}
                            hasClear
                        />
                        <span className={b('error')}>{validationError}</span>
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

    const renderEmbeddedVersionWarning = () => {
        return (
            <React.Fragment>
                <Popup
                    className={b('embedded-popup')}
                    anchorRef={warningRef}
                    placement={['top']}
                    open={isEmbeddedWarningVisible}
                    hasArrow
                >
                    {EMBEDDED_VERSION_WARNING}
                </Popup>
                <div
                    className={b('embedded-tooltip')}
                    ref={warningRef}
                    onMouseEnter={onEmbeddedWarningOpen}
                    onMouseLeave={onEmbeddedWarningClose}
                >
                    <Icon name="question" height={18} width={18} viewBox="0 0 24 24" />
                </div>
            </React.Fragment>
        );
    };

    return (
        <React.Fragment>
            {queryNameToEdit ? renderSaveDropdownMenu() : renderSaveButton(onSaveQueryClick)}
            {isDialogVisible && renderDialog()}

            {singleClusterMode && renderEmbeddedVersionWarning()}
        </React.Fragment>
    );
}

export default SaveQuery;
