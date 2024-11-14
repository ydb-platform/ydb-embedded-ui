import * as NiceModal from '@ebay/nice-modal-react';
import type {ButtonView} from '@gravity-ui/uikit';
import {Dialog} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import {confirmationDialogKeyset} from './i18n';

import './ConfirmationDialog.scss';

const block = cn('confirmation-dialog');

interface CommonDialogProps {
    caption?: string;
    message?: React.ReactNode;
    body?: React.ReactNode;

    progress?: boolean;
    textButtonCancel?: string;
    textButtonApply?: string;
    buttonApplyView?: ButtonView;
    className?: string;
    onConfirm?: () => void;
}

interface ConfirmationDialogNiceModalProps extends CommonDialogProps {
    onClose?: () => void;
}

interface ConfirmationDialogProps extends CommonDialogProps {
    onClose: () => void;
    open: boolean;
    children?: React.ReactNode;
}

export const CONFIRMATION_DIALOG = 'confirmation-dialog';
function ConfirmationDialog({
    caption = '',
    children,
    onConfirm,
    onClose,
    progress,
    textButtonApply,
    textButtonCancel,
    buttonApplyView = 'normal',
    className,
    open,
}: ConfirmationDialogProps) {
    return (
        <Dialog
            className={block(null, className)}
            size="s"
            onClose={onClose}
            disableOutsideClick
            open={open}
        >
            <Dialog.Header caption={caption} />
            <Dialog.Body>{children}</Dialog.Body>
            <Dialog.Footer
                onClickButtonApply={onConfirm}
                propsButtonApply={{view: buttonApplyView}}
                textButtonApply={textButtonApply}
                textButtonCancel={textButtonCancel ?? confirmationDialogKeyset('action_cancel')}
                onClickButtonCancel={onClose}
                loading={progress}
            />
        </Dialog>
    );
}

export const ConfirmationDialogNiceModal = NiceModal.create(
    (props: ConfirmationDialogNiceModalProps) => {
        const modal = NiceModal.useModal();

        const handleClose = () => {
            modal.hide();
            modal.remove();
        };

        return (
            <ConfirmationDialog
                {...props}
                onConfirm={async () => {
                    await props.onConfirm?.();
                    modal.resolve(true);
                    handleClose();
                }}
                onClose={() => {
                    props.onClose?.();
                    modal.resolve(false);
                    handleClose();
                }}
                open={modal.visible}
            />
        );
    },
);

NiceModal.register(CONFIRMATION_DIALOG, ConfirmationDialogNiceModal);
