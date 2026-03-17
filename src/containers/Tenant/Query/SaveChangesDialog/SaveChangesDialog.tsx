import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Button, Dialog, TextInput} from '@gravity-ui/uikit';

import type {SavedQuery} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import {getQueryNameValidationError} from '../utils/QueryNameValidation';

import i18n from './i18n';

import './SaveChangesDialog.scss';

const b = cn('ydb-save-changes-dialog');

export const SAVE_CHANGES_DIALOG = 'save-changes-dialog';

export interface SaveChangesDialogOptions {
    defaultQueryName: string;
    existingQueryName?: string;
    queryBody: string;
    savedQueries: SavedQuery[];
    onSaveQuery: (name: string | null, body: string) => void;
}

interface SaveChangesDialogProps extends SaveChangesDialogOptions {
    open: boolean;
    onDontSave: () => void;
    onCancel: () => void;
    onSave: (queryName: string) => void;
}

function SaveChangesDialog({
    open,
    onDontSave,
    onCancel,
    onSave,
    defaultQueryName,
    existingQueryName,
    savedQueries,
}: SaveChangesDialogProps) {
    const [queryName, setQueryName] = React.useState(defaultQueryName);
    const [validationError, setValidationError] = React.useState<string>();
    const controlRef = React.useRef<HTMLInputElement>(null);

    const validateQueryName = React.useCallback(
        (value: string) => {
            const validationError = getQueryNameValidationError(value);
            if (validationError) {
                return validationError === 'not-empty'
                    ? i18n('error.name-not-empty')
                    : i18n('error.name-min-length');
            }
            const normalizedValue = value.trim().toLowerCase();
            const normalizedExistingQueryName = existingQueryName?.trim().toLowerCase();

            if (
                savedQueries?.some(
                    (q) =>
                        q.name.toLowerCase() === normalizedValue &&
                        q.name.toLowerCase() !== normalizedExistingQueryName,
                )
            ) {
                return i18n('error.name-exists');
            }
            return undefined;
        },
        [existingQueryName, savedQueries],
    );

    const handleQueryNameChange = React.useCallback((value: string) => {
        setQueryName(value);
        setValidationError(undefined);
    }, []);

    const handleSubmit = React.useCallback(() => {
        const error = validateQueryName(queryName);
        setValidationError(error);
        if (!error) {
            onSave(queryName);
        }
    }, [queryName, validateQueryName, onSave]);

    return (
        <Dialog size="s" open={open} onClose={onCancel} initialFocus={controlRef}>
            <Dialog.Header caption={i18n('title')} />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <Dialog.Body className={b('body')}>
                    <div>{i18n('description')}</div>
                    <div className={b('control-wrapper')}>
                        <TextInput
                            value={queryName}
                            onUpdate={handleQueryNameChange}
                            controlRef={controlRef}
                            hasClear
                            autoComplete={false}
                            validationState={validationError ? 'invalid' : undefined}
                            errorMessage={validationError}
                        />
                    </div>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonCancel={i18n('action.cancel')}
                    propsButtonCancel={{view: 'flat'}}
                    onClickButtonCancel={onCancel}
                    textButtonApply={i18n('action.save')}
                    propsButtonApply={{type: 'submit'}}
                >
                    <Button
                        view="outlined"
                        size="l"
                        width="max"
                        className={b('dont-save-button')}
                        onClick={onDontSave}
                    >
                        {i18n('action.dont-save')}
                    </Button>
                </Dialog.Footer>
            </form>
        </Dialog>
    );
}

export const SaveChangesDialogNiceModal = NiceModal.create((props: SaveChangesDialogOptions) => {
    const modal = NiceModal.useModal();

    const handleClose = React.useCallback(() => {
        modal.hide();
        modal.remove();
    }, [modal]);

    const handleDontSave = React.useCallback(() => {
        modal.resolve(true);
        handleClose();
    }, [modal, handleClose]);

    const handleCancel = React.useCallback(() => {
        modal.resolve(false);
        handleClose();
    }, [modal, handleClose]);

    const handleSave = React.useCallback(
        (queryName: string) => {
            props.onSaveQuery(queryName, props.queryBody);
            modal.resolve(true);
            handleClose();
        },
        [handleClose, modal, props],
    );

    return (
        <SaveChangesDialog
            {...props}
            open={modal.visible}
            onDontSave={handleDontSave}
            onCancel={handleCancel}
            onSave={handleSave}
        />
    );
});

NiceModal.register(SAVE_CHANGES_DIALOG, SaveChangesDialogNiceModal);

export async function getSaveChangesConfirmation(
    options: SaveChangesDialogOptions,
): Promise<boolean> {
    return await NiceModal.show(SAVE_CHANGES_DIALOG, {
        id: SAVE_CHANGES_DIALOG,
        ...options,
    });
}
