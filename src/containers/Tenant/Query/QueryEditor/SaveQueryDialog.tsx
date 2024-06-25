import React from 'react';

import type {DialogProps} from '@gravity-ui/uikit';
import {Dialog, TextInput} from '@gravity-ui/uikit';

import {SAVED_QUERIES_KEY, useSetting, useTypedSelector} from '../../../../lib';
import type {SavedQuery} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';

import './SaveQueryDialog.scss';

const b = cn('kv-save-query');

interface SaveQueryDialogProps extends Pick<DialogProps, 'open'> {
    onSaveQuery: (name: string) => void;
    onCloseDialog: () => void;
}

export const SaveQueryDialog = ({open, onSaveQuery, onCloseDialog}: SaveQueryDialogProps) => {
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);

    const [queryName, setQueryName] = React.useState('');
    const [savedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY);
    const [validationError, setValidationError] = React.useState('');

    const resetDialog = () => {
        onCloseDialog();
        setQueryName('');
    };

    const handleQueryNameChange = (value: string) => {
        setQueryName(value);
        setValidationError('');
    };

    const checkQueryName = (name: string) => {
        if (savedQueries.some((query) => query.name === name)) {
            setValidationError(`Query name '${queryName}' already exists`);
            return false;
        }

        return true;
    };

    const handleSaveQuery = () => {
        const isValid = checkQueryName(queryName);

        if (isValid) {
            onSaveQuery(queryName);

            resetDialog();
        }
    };

    const handleClose = () => {
        resetDialog();
    };

    return (
        <Dialog
            open={open}
            hasCloseButton={false}
            size="s"
            onClose={handleClose}
            onEnterKeyDown={handleSaveQuery}
        >
            <Dialog.Header caption="Save query" />
            <Dialog.Body className={b('dialog-body')}>
                {singleClusterMode && (
                    <div className={b('dialog-row')}>The query will be saved in your browser</div>
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
                            onUpdate={handleQueryNameChange}
                            hasClear
                            autoFocus
                            error={Boolean(validationError)}
                            errorMessage={validationError}
                        />
                    </div>
                </div>
            </Dialog.Body>
            <Dialog.Footer
                textButtonApply="Save"
                textButtonCancel="Cancel"
                onClickButtonCancel={handleClose}
                onClickButtonApply={handleSaveQuery}
                propsButtonApply={{
                    disabled: !queryName || Boolean(validationError),
                }}
            />
        </Dialog>
    );
};
