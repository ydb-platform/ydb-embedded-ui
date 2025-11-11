import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import type {ButtonView, DialogFooterProps} from '@gravity-ui/uikit';
import {Dialog} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import {confirmationDialogKeyset} from './i18n';

import './ConfirmationDialog.scss';

const block = cn('confirmation-dialog');

interface CommonDialogProps {
    caption?: string;
    message?: React.ReactNode;
    body?: React.ReactNode;
    size?: 's' | 'm' | 'l';

    progress?: boolean;
    textButtonCancel?: string;
    textButtonApply?: string;
    buttonApplyView?: ButtonView;
    className?: string;
    onConfirm?: () => void;
}

interface ConfirmationDialogNiceModalProps extends CommonDialogProps, DialogFooterProps {
    onClose?: () => void;
}

interface ConfirmationDialogProps extends CommonDialogProps, DialogFooterProps {
    onClose: () => void;
    open: boolean;
    children?: React.ReactNode;
}

export const CONFIRMATION_DIALOG = 'confirmation-dialog';
function ConfirmationDialog({
    caption = '',
    children,
    size = 's',
    onConfirm,
    onClose,
    progress,
    textButtonApply,
    textButtonCancel,
    buttonApplyView = 'normal',
    className,
    renderButtons,
    open,
}: ConfirmationDialogProps) {
    return (
        <Dialog
            className={block(null, className)}
            size={size}
            onClose={onClose}
            disableOutsideClick
            open={open}
        >
            <Dialog.Header caption={<span className={block('caption')}>{caption}</span>} />
            <Dialog.Body>{children}</Dialog.Body>
            <Dialog.Footer
                onClickButtonApply={onConfirm}
                propsButtonApply={{view: buttonApplyView}}
                textButtonApply={textButtonApply}
                textButtonCancel={textButtonCancel ?? confirmationDialogKeyset('action_cancel')}
                onClickButtonCancel={onClose}
                loading={progress}
                renderButtons={renderButtons}
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
