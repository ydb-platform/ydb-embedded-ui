import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Dialog} from '@gravity-ui/uikit';

import i18n from './i18n';

export const RUNNING_QUERY_DIALOG = 'running-query-dialog';

interface RunningQueryDialogProps {
    open: boolean;
    onStopAndClose: () => void;
    onCancel: () => void;
}

function RunningQueryDialog({open, onStopAndClose, onCancel}: RunningQueryDialogProps) {
    return (
        <Dialog size="s" open={open} onClose={onCancel}>
            <Dialog.Header caption={i18n('title_query-is-running')} />
            <Dialog.Body>{i18n('context_query-will-be-stopped')}</Dialog.Body>
            <Dialog.Footer
                textButtonApply={i18n('action_stop-and-close')}
                propsButtonApply={{view: 'action'}}
                onClickButtonApply={onStopAndClose}
                textButtonCancel={i18n('action_cancel')}
                onClickButtonCancel={onCancel}
            />
        </Dialog>
    );
}

const RunningQueryDialogNiceModal = NiceModal.create(() => {
    const modal = NiceModal.useModal();

    const handleClose = React.useCallback(() => {
        modal.hide();
        modal.remove();
    }, [modal]);

    const handleStopAndClose = React.useCallback(() => {
        modal.resolve(true);
        handleClose();
    }, [modal, handleClose]);

    const handleCancel = React.useCallback(() => {
        modal.resolve(false);
        handleClose();
    }, [modal, handleClose]);

    return (
        <RunningQueryDialog
            open={modal.visible}
            onStopAndClose={handleStopAndClose}
            onCancel={handleCancel}
        />
    );
});

NiceModal.register(RUNNING_QUERY_DIALOG, RunningQueryDialogNiceModal);

export async function getRunningQueryConfirmation(): Promise<boolean> {
    return await NiceModal.show(RUNNING_QUERY_DIALOG, {
        id: RUNNING_QUERY_DIALOG,
    });
}
