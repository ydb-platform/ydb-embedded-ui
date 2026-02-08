import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Button, Dialog} from '@gravity-ui/uikit';

import {useTypedSelector} from '..';
import {SaveQueryButton} from '../../../containers/Tenant/Query/SaveQuery/SaveQuery';
import {selectUserInput} from '../../../store/reducers/query/query';
import {cn} from '../../cn';

import i18n from './i18n';

import './UnsavedChangesDialog.scss';

const b = cn('ydb-unsaved-changes-dialog');

export const UNSAVED_CHANGES_DIALOG = 'unsaved-changes-dialog';

interface SaveQueryButtonInDialogProps {
    onSuccess: () => void;
    onCancel: () => void;
}

function SaveQueryButtonInDialog({onSuccess, onCancel}: SaveQueryButtonInDialogProps) {
    const currentInput = useTypedSelector(selectUserInput);
    const dialogProps = React.useMemo(
        () => ({
            onSuccess,
            onCancel,
            queryBody: currentInput,
        }),
        [currentInput, onSuccess, onCancel],
    );

    return (
        <SaveQueryButton view="action" size="l" dialogProps={dialogProps}>
            {i18n('action_save-changes')}
        </SaveQueryButton>
    );
}

interface UnsavedChangesDialogProps {
    open: boolean;
    onDontSave: () => void;
    onCancel: () => void;
    onSaveSuccess: () => void;
}

function UnsavedChangesDialog({
    open,
    onDontSave,
    onCancel,
    onSaveSuccess,
}: UnsavedChangesDialogProps) {
    return (
        <Dialog size="s" open={open} onClose={onCancel}>
            <Dialog.Header caption={i18n('title_save-changes')} />
            <Dialog.Body>{i18n('context_changes-will-be-lost')}</Dialog.Body>
            <Dialog.Footer
                textButtonCancel={i18n('action_cancel')}
                propsButtonCancel={{view: 'flat'}}
                onClickButtonCancel={onCancel}
                renderButtons={(_buttonApply, buttonCancel) => (
                    <React.Fragment>
                        {buttonCancel}
                        <SaveQueryButtonInDialog onSuccess={onSaveSuccess} onCancel={onCancel} />
                    </React.Fragment>
                )}
            >
                <Button
                    view="outlined"
                    size="l"
                    width="max"
                    className={b('dont-save-button')}
                    onClick={onDontSave}
                >
                    {i18n('action_dont-save')}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
}

export const UnsavedChangesDialogNiceModal = NiceModal.create(() => {
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

    const handleSaveSuccess = React.useCallback(() => {
        modal.resolve(true);
        handleClose();
    }, [modal, handleClose]);

    return (
        <UnsavedChangesDialog
            open={modal.visible}
            onDontSave={handleDontSave}
            onCancel={handleCancel}
            onSaveSuccess={handleSaveSuccess}
        />
    );
});

NiceModal.register(UNSAVED_CHANGES_DIALOG, UnsavedChangesDialogNiceModal);
