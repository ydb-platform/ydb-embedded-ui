import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import {Alert, Dialog, Flex, TextInput} from '@gravity-ui/uikit';

import {partitionsApi} from '../../../../../store/reducers/partitions/partitions';
import type {CommitOffsetParams} from '../../../../../store/reducers/partitions/types';
import {cn} from '../../../../../utils/cn';
import createToast from '../../../../../utils/createToast';
import {prepareCommonErrorMessage} from '../../../../../utils/errors';
import i18n from '../i18n';

const b = cn('ydb-specify-offset-dialog');

const SPECIFY_OFFSET_DIALOG = 'specify-offset-dialog';

type CommitOffsetParamsWithoutOffset = Omit<CommitOffsetParams, 'offset'>;

interface SpecifyOffsetDialogProps extends CommitOffsetParamsWithoutOffset {
    onClose: () => void;
    onSuccess: () => void;
    open: boolean;
}

function SpecifyOffsetDialog({
    database,
    path,
    consumer,
    partitionId,
    readSessionId,
    onClose,
    onSuccess,
    open,
}: SpecifyOffsetDialogProps) {
    const [offsetValue, setOffsetValue] = React.useState('');
    const [validationError, setValidationError] = React.useState<string>();

    const [commitOffset, {isLoading, error}] = partitionsApi.useCommitOffsetMutation();

    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleOffsetChange = React.useCallback((value: string) => {
        setOffsetValue(value);
        setValidationError(undefined);
    }, []);

    const handleConfirm = React.useCallback(async () => {
        const numericOffset = Number(offsetValue.trim());
        if (!offsetValue || !Number.isInteger(numericOffset) || numericOffset < 0) {
            setValidationError(i18n('error_invalid-offset'));
            return;
        }

        try {
            await commitOffset({
                database,
                path,
                consumer,
                partitionId,
                offset: numericOffset,
                readSessionId,
            }).unwrap();

            createToast({
                name: 'commitOffset',
                content: i18n('alert_offset-moved'),
                theme: 'success',
                title: '',
            });

            onSuccess();
        } catch {
            // error is captured by the mutation hook state
        }
    }, [
        offsetValue,
        commitOffset,
        database,
        path,
        consumer,
        partitionId,
        readSessionId,
        onSuccess,
    ]);

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
                        validationState={validationError ? 'invalid' : undefined}
                        errorMessage={validationError}
                    />
                    <Alert theme="warning" message={i18n('alert_move-offset-forward')} />
                    {error ? (
                        <Alert theme="danger" message={prepareCommonErrorMessage(error)} />
                    ) : null}
                </Flex>
            </Dialog.Body>
            <Dialog.Footer
                loading={isLoading}
                onClickButtonApply={handleConfirm}
                propsButtonApply={{view: 'action', disabled: !offsetValue}}
                textButtonApply={i18n('action_move-offset')}
                textButtonCancel={i18n('action_cancel')}
                onClickButtonCancel={onClose}
            />
        </Dialog>
    );
}

type ShowSpecifyOffsetConfirmationParams = CommitOffsetParamsWithoutOffset;

const SpecifyOffsetDialogNiceModal = NiceModal.create(
    (props: ShowSpecifyOffsetConfirmationParams) => {
        const modal = NiceModal.useModal();

        const handleClose = React.useCallback(() => {
            modal.hide();
            modal.remove();
        }, [modal]);

        const handleSuccess = React.useCallback(() => {
            modal.resolve(true);
            handleClose();
        }, [modal, handleClose]);

        return (
            <SpecifyOffsetDialog
                {...props}
                onSuccess={handleSuccess}
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
