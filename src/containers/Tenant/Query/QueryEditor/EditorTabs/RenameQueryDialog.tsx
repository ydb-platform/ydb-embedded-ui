import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Dialog, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import i18n from '../../i18n';

export const RENAME_QUERY_DIALOG = 'rename-query-dialog';

import './RenameQueryDialog.scss';

const b = cn('rename-query-dialog');

export interface RenameQueryDialogNiceModalProps {
    title: string;
    onRename: (title: string) => void;
}

function RenameQueryDialog({
    open,
    title,
    onRename,
    onClose,
}: RenameQueryDialogNiceModalProps & {open: boolean; onClose: VoidFunction}) {
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
            setErrorMessage(i18n('editor-tabs.rename-query-dialog.error-empty'));
            return;
        }

        if (normalizedTitle.length < 3) {
            setErrorMessage(i18n('editor-tabs.rename-query-dialog.error-min-length'));
            return;
        }

        onRename(normalizedTitle);
        handleClose();
    }, [handleClose, nextTitle, onRename]);

    const controlRef = React.useRef<null | HTMLInputElement>(null);

    return (
        <Dialog
            open={open}
            hasCloseButton={true}
            size="s"
            onClose={handleClose}
            onEnterKeyDown={handleApply}
            initialFocus={controlRef}
            className={b()}
        >
            <Dialog.Header caption={i18n('editor-tabs.rename-query-dialog.title')} />
            <Dialog.Body>
                <div className={b('dialog-row')}>
                    {i18n('editor-tabs.rename-query-dialog.description')}
                </div>
                <div className={b('dialog-row')}>
                    <div className={b('control-wrapper')}>
                        <TextInput
                            value={nextTitle}
                            onUpdate={handleTitleChange}
                            placeholder={i18n('editor-tabs.rename-query-dialog.input-placeholder')}
                            controlRef={controlRef}
                            hasClear
                            autoComplete={false}
                            validationState={errorMessage ? 'invalid' : undefined}
                            errorMessage={errorMessage}
                        />
                    </div>
                </div>
            </Dialog.Body>
            <Dialog.Footer
                textButtonApply={i18n('editor-tabs.rename-query-dialog.apply')}
                textButtonCancel={i18n('editor-tabs.rename-query-dialog.cancel')}
                onClickButtonApply={handleApply}
                onClickButtonCancel={handleClose}
            />
        </Dialog>
    );
}

export const RenameQueryDialogNiceModal = NiceModal.create(
    (props: RenameQueryDialogNiceModalProps) => {
        const modal = NiceModal.useModal();

        const handleClose = React.useCallback(() => {
            modal.hide();
            modal.remove();
        }, [modal]);

        return <RenameQueryDialog {...props} open={modal.visible} onClose={handleClose} />;
    },
);

NiceModal.register(RENAME_QUERY_DIALOG, RenameQueryDialogNiceModal);
