import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import type {DialogFooterProps} from '@gravity-ui/uikit';
import {Dialog, Flex, Select, Switch, Text, TextInput} from '@gravity-ui/uikit';
import type {Control, UseFormTrigger} from 'react-hook-form';
import {Controller} from 'react-hook-form';

import {cn} from '../../../../../../utils/cn';
import {prepareErrorMessage} from '../../../../../../utils/prepareErrorMessage';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from '../constants';

import type {UnitOptionsType} from './constants';
import {DEFAULT_MAX_SPLIT_SIZE_GB, MANAGE_PARTITIONING_DIALOG, UNIT_OPTIONS} from './constants';
import i18n from './i18n';
import type {ManagePartitioningFormState} from './types';
import {useManagePartitioningForm} from './useManagePartitionForm';

import './ManagePartitioningDialog.scss';

const b = cn(MANAGE_PARTITIONING_DIALOG);

interface CommonDialogProps {
    initialValue?: ManagePartitioningFormState;
    onApply?: (value: ManagePartitioningFormState) => void | Promise<void>;
}

interface ManagePartitioningDialogNiceModalProps extends CommonDialogProps, DialogFooterProps {
    onClose?: () => void;
}

interface ManagePartitioningDialogProps extends CommonDialogProps, DialogFooterProps {
    onClose: () => void;
    open: boolean;
}

function SplitUnitSelect(props: {
    control: Control<ManagePartitioningFormState>;
    trigger: UseFormTrigger<ManagePartitioningFormState>;
}) {
    return (
        <Controller
            name="splitUnit"
            control={props.control}
            render={({field}) => (
                <Select<UnitOptionsType>
                    size="s"
                    width={65}
                    options={UNIT_OPTIONS}
                    value={[field.value]}
                    onUpdate={(value) => {
                        const nextUnit = value?.[0] ?? field.value;
                        field.onChange(nextUnit);
                        props.trigger('splitSize');
                    }}
                />
            )}
        />
    );
}

function ManagePartitioningDialog({
    onClose,
    open,
    renderButtons,
    initialValue,
    onApply,
}: ManagePartitioningDialogProps) {
    const [apiError, setApiError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const {
        control,
        handleSubmit,
        trigger,
        formState: {errors, isValid},
    } = useManagePartitioningForm({
        initialValue,
        maxSplitSizeBytes: DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES,
    });

    const handleApply = handleSubmit(async (data) => {
        setApiError(null);
        setIsSubmitting(true);
        try {
            await onApply?.(data);
        } catch (error) {
            setApiError(prepareErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    });

    return (
        <Dialog size="s" onClose={onClose} open={open}>
            <Dialog.Header
                caption={<Text variant="subheader-3">{i18n('title_manage-partitioning')}</Text>}
            />

            <form onSubmit={handleApply}>
                <Dialog.Body className={b('body')}>
                    <Flex direction="column" gap="3" alignItems="flex-start">
                        <Text variant="subheader-1">{i18n('title_partitioning')}</Text>

                        <Flex className={b('row')} gap="3" alignItems="center">
                            <label htmlFor="splitSize" className={b('label')}>
                                {i18n('field_split-size')}
                            </label>

                            <Controller
                                name="splitSize"
                                control={control}
                                render={({field}) => (
                                    <TextInput
                                        id="splitSize"
                                        type="number"
                                        value={field.value}
                                        onUpdate={field.onChange}
                                        className={b('input')}
                                        errorMessage={errors.splitSize?.message}
                                        validationState={errors.splitSize ? 'invalid' : undefined}
                                        endContent={
                                            <SplitUnitSelect control={control} trigger={trigger} />
                                        }
                                    />
                                )}
                            />

                            <Text variant="body-1" className={b('hint')}>
                                {i18n('context_split-size-maximum', {
                                    maxGb: DEFAULT_MAX_SPLIT_SIZE_GB,
                                })}
                            </Text>
                        </Flex>

                        <Flex className={b('row')} gap="3" alignItems="center">
                            <label htmlFor="loadEnabled" className={b('label')}>
                                {i18n('field_load')}
                            </label>

                            <Flex className={b('input')} gap="3" alignItems="center">
                                <Controller
                                    name="loadEnabled"
                                    control={control}
                                    render={({field}) => (
                                        <Switch
                                            id="loadEnabled"
                                            checked={field.value}
                                            onUpdate={field.onChange}
                                        />
                                    )}
                                />
                            </Flex>
                        </Flex>

                        <Text variant="subheader-1">{i18n('title_limits')}</Text>

                        <Flex className={b('row')} gap="3" alignItems="center">
                            <label htmlFor="minimum" className={b('label')}>
                                {i18n('field_minimum')}
                            </label>

                            <Controller
                                name="minimum"
                                control={control}
                                render={({field}) => (
                                    <TextInput
                                        id="minimum"
                                        type="number"
                                        value={field.value}
                                        onUpdate={(next) => {
                                            field.onChange(next);
                                            trigger('maximum'); // revalidate dependent field to clear stale error
                                        }}
                                        className={b('input')}
                                        errorMessage={errors.minimum?.message}
                                        validationState={errors.minimum ? 'invalid' : undefined}
                                    />
                                )}
                            />
                        </Flex>

                        <Flex className={b('row')} gap="3" alignItems="center">
                            <label htmlFor="maximum" className={b('label')}>
                                {i18n('field_maximum')}
                            </label>

                            <Controller
                                name="maximum"
                                control={control}
                                render={({field}) => (
                                    <TextInput
                                        id="maximum"
                                        type="number"
                                        value={field.value}
                                        onUpdate={(next) => {
                                            field.onChange(next);
                                            trigger('minimum'); // revalidate dependent field to clear stale error
                                        }}
                                        className={b('input')}
                                        errorMessage={errors.maximum?.message}
                                        validationState={errors.maximum ? 'invalid' : undefined}
                                    />
                                )}
                            />
                        </Flex>
                        {apiError && (
                            <Text color="danger" title={apiError}>
                                <div>{apiError}</div>
                            </Text>
                        )}
                    </Flex>
                </Dialog.Body>

                <Dialog.Footer
                    textButtonApply={i18n('action_apply')}
                    textButtonCancel={i18n('action_cancel')}
                    onClickButtonCancel={onClose}
                    loading={isSubmitting}
                    renderButtons={renderButtons}
                    propsButtonApply={{
                        type: 'submit',
                        disabled: isSubmitting || !isValid,
                    }}
                />
            </form>
        </Dialog>
    );
}

export const ManagePartitioningDialogNiceModal = NiceModal.create(
    (props: ManagePartitioningDialogNiceModalProps) => {
        const modal = NiceModal.useModal();

        const handleClose = () => {
            modal.hide();
            modal.remove();
        };

        return (
            <ManagePartitioningDialog
                {...props}
                onApply={async (value) => {
                    await props.onApply?.(value);
                    modal.resolve(value);
                    handleClose();
                }}
                onClose={() => {
                    props.onClose?.();
                    modal.resolve(null);
                    handleClose();
                }}
                open={modal.visible}
            />
        );
    },
);

NiceModal.register(MANAGE_PARTITIONING_DIALOG, ManagePartitioningDialogNiceModal);

export function openManagePartitioningDialog(
    props?: Omit<ManagePartitioningDialogNiceModalProps, 'id'>,
): Promise<ManagePartitioningFormState | null> {
    return NiceModal.show(MANAGE_PARTITIONING_DIALOG, {
        id: MANAGE_PARTITIONING_DIALOG,
        ...props,
    }) as Promise<ManagePartitioningFormState | null>;
}
