import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import {Alert, Dialog, Flex, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';

const b = cn('ydb-specify-offset-dialog');

const SPECIFY_OFFSET_DIALOG = 'specify-offset-dialog';

interface SpecifyOffsetDialogProps {
    partitionId: string | number;
    consumer: string;
    onConfirm: (offset: number) => void;
    onClose: () => void;
    open: boolean;
}

function SpecifyOffsetDialog({
    partitionId,
    consumer,
    onConfirm,
    onClose,
    open,
}: SpecifyOffsetDialogProps) {
    const [offsetValue, setOffsetValue] = React.useState('');
    const [validationError, setValidationError] = React.useState<string>();

    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleOffsetChange = React.useCallback((value: string) => {
        setOffsetValue(value);
        setValidationError(undefined);
    }, []);

    const handleConfirm = React.useCallback(() => {
        const numericOffset = Number(offsetValue);

        if (!offsetValue || isNaN(numericOffset)) {
            setValidationError(i18n('error_invalid-offset'));
            return;
        }

        if (!Number.isInteger(numericOffset) || numericOffset < 0) {
            setValidationError(i18n('error_invalid-offset'));
            return;
        }

        onConfirm(numericOffset);
    }, [offsetValue, onConfirm]);

    return (
        <Dialog
            className={b()}
            size="s"
            onClose={onClose}
            disableOutsideClick
            open={open}
            initialFocus={inputRef}
            onEnterKeyDown={handleConfirm}
        >
            <Dialog.Header caption={i18n('title_specify-offset')} />
            <Dialog.Body>
                <Flex direction="column" gap={4}>
                    {i18n('confirm_specify-offset', {
                        partitionId: String(partitionId),
                        consumer,
                    })}
                    <TextInput
                        controlRef={inputRef}
                        type="number"
                        value={offsetValue}
                        onUpdate={handleOffsetChange}
                        label={i18n('context_offset')}
                        autoFocus
                        hasClear
                        autoComplete={false}
                        validationState={validationError ? 'invalid' : undefined}
                        errorMessage={validationError}
                    />
                    <Alert theme="warning" message={i18n('alert_move-offset-forward')} />
                </Flex>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonApply={handleConfirm}
                propsButtonApply={{view: 'action', disabled: !offsetValue}}
                textButtonApply={i18n('action_move-offset')}
                textButtonCancel={i18n('action_cancel')}
                onClickButtonCancel={onClose}
            />
        </Dialog>
    );
}

interface ShowSpecifyOffsetConfirmationParams {
    partitionId: string | number;
    consumer: string;
    onConfirm: (offset: number) => void;
}

const SpecifyOffsetDialogNiceModal = NiceModal.create(
    (props: ShowSpecifyOffsetConfirmationParams) => {
        const modal = NiceModal.useModal();

        const handleClose = React.useCallback(() => {
            modal.hide();
            modal.remove();
        }, [modal]);

        const handleConfirm = React.useCallback(
            (offset: number) => {
                props.onConfirm(offset);
                modal.resolve(true);
                handleClose();
            },
            [props, modal, handleClose],
        );

        return (
            <SpecifyOffsetDialog
                {...props}
                onConfirm={handleConfirm}
                onClose={handleClose}
                open={modal.visible}
            />
        );
    },
);

NiceModal.register(SPECIFY_OFFSET_DIALOG, SpecifyOffsetDialogNiceModal);

export function showSpecifyOffsetConfirmation(params: ShowSpecifyOffsetConfirmationParams) {
    NiceModal.show(SPECIFY_OFFSET_DIALOG, {
        id: SPECIFY_OFFSET_DIALOG,
        ...params,
    });
}
