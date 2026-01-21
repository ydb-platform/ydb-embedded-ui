import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Dialog, TextInput} from '@gravity-ui/uikit';

import i18n from '../../i18n';

export const RENAME_TAB_DIALOG = 'rename-tab-dialog';

export interface RenameTabDialogNiceModalProps {
    title: string;
    onRename: (title: string) => void;
}

function RenameTabDialog({
    open,
    title,
    onRename,
    onClose,
}: RenameTabDialogNiceModalProps & {open: boolean; onClose: VoidFunction}) {
    const [nextTitle, setNextTitle] = React.useState(title);
    const [errorMessage, setErrorMessage] = React.useState<string>();

    const handleClose = React.useCallback(() => {
        onClose();
    }, [onClose]);

    const handleTitleChange = React.useCallback((value: string) => {
        setNextTitle(value);
        setErrorMessage(undefined);
    }, []);

    const handleApply = React.useCallback(() => {
        const normalizedTitle = nextTitle.trim();
        if (!normalizedTitle) {
            setErrorMessage(i18n('editor-tabs.rename-dialog.error-empty'));
            return;
        }

        onRename(normalizedTitle);
        handleClose();
    }, [handleClose, nextTitle, onRename]);

    React.useEffect(() => {
        if (open) {
            setNextTitle(title);
            setErrorMessage(undefined);
        }
    }, [open, title]);

    return (
        <Dialog
            open={open}
            hasCloseButton={false}
            size="s"
            onClose={handleClose}
            onEnterKeyDown={handleApply}
        >
            <Dialog.Header caption={i18n('editor-tabs.rename-dialog.title')} />
            <Dialog.Body>
                <TextInput
                    value={nextTitle}
                    onUpdate={handleTitleChange}
                    placeholder={i18n('editor-tabs.rename-dialog.input-placeholder')}
                    autoFocus
                    hasClear
                    autoComplete={false}
                    validationState={errorMessage ? 'invalid' : undefined}
                    errorMessage={errorMessage}
                />
            </Dialog.Body>
            <Dialog.Footer
                textButtonApply={i18n('editor-tabs.rename-dialog.apply')}
                textButtonCancel={i18n('editor-tabs.rename-dialog.cancel')}
                onClickButtonApply={handleApply}
                onClickButtonCancel={handleClose}
            />
        </Dialog>
    );
}

export const RenameTabDialogNiceModal = NiceModal.create((props: RenameTabDialogNiceModalProps) => {
    const modal = NiceModal.useModal();

    const handleClose = React.useCallback(() => {
        modal.hide();
        modal.remove();
    }, [modal]);

    return <RenameTabDialog {...props} open={modal.visible} onClose={handleClose} />;
});

NiceModal.register(RENAME_TAB_DIALOG, RenameTabDialogNiceModal);
