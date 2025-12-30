import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import type {DialogFooterProps} from '@gravity-ui/uikit';
import {Dialog, Flex, Select, Switch, Text, TextInput} from '@gravity-ui/uikit';
import {Controller} from 'react-hook-form';

import type {BytesSizes} from '../../../../../../utils/bytesParsers';
import {cn} from '../../../../../../utils/cn';
import {prepareErrorMessage} from '../../../../../../utils/prepareErrorMessage';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from '../constants';

import {DEFAULT_MAX_SPLIT_SIZE_GB, UNIT_OPTIONS} from './constants';
import i18n from './i18n';
import {useManagePartitioningForm} from './useManagePartitionForm';
import {toManagePartitioningValue} from './utils';

import './ManagePartitioningDialog.scss';

const b = cn('manage-partitioning-dialog');

export interface ManagePartitioningValue {
    splitSize: string;
    splitUnit: BytesSizes;
    loadEnabled: boolean;
    loadPercent: string;
    minimum: string;
    maximum: string;
}

interface CommonDialogProps {
    initialValue?: ManagePartitioningValue;
    onApply?: (value: ManagePartitioningValue) => void | Promise<void>;
}

interface ManagePartitioningDialogNiceModalProps extends CommonDialogProps, DialogFooterProps {
    onClose?: () => void;
}

interface ManagePartitioningDialogProps extends CommonDialogProps, DialogFooterProps {
    onClose: () => void;
    open: boolean;
}

export const MANAGE_PARTITIONING_DIALOG = 'manage-partitioning-dialog';

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
        watch,
        trigger,
        formState: {errors, isValid},
    } = useManagePartitioningForm({
        initialValue,
        maxSplitSizeBytes: DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES,
    });

    const splitUnit = watch('splitUnit');

    React.useEffect(() => {
        trigger('splitSize');
    }, [splitUnit, trigger]);

    const loadEnabled = watch('loadEnabled');

    const handleApply = handleSubmit(async (data) => {
        setApiError(null);
        setIsSubmitting(true);
        try {
            await onApply?.(toManagePartitioningValue(data));
        } catch (e) {
            setApiError(prepareErrorMessage(e));
        } finally {
            setIsSubmitting(false);
        }
    });

    const unitOptions = React.useMemo(
        () =>
            UNIT_OPTIONS.map((unit) => (
                <Select.Option key={unit.value} value={unit.value}>
                    {unit.label}
                </Select.Option>
            )),
        [],
    );

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
                            <Text variant="body-1" className={b('label')}>
                                {i18n('field_split-size')}
                            </Text>

                            <Controller
                                name="splitSize"
                                control={control}
                                render={({field}) => (
                                    <TextInput
                                        type="number"
                                        value={String(field.value)}
                                        onUpdate={field.onChange}
                                        className={b('input')}
                                        errorMessage={errors.splitSize?.message}
                                        validationState={errors.splitSize ? 'invalid' : undefined}
                                        endContent={
                                            <Controller
                                                name="splitUnit"
                                                control={control}
                                                render={({field: unitField}) => (
                                                    <Select
                                                        className={b('select')}
                                                        size="s"
                                                        width={65}
                                                        value={[unitField.value]}
                                                        onUpdate={(v) =>
                                                            unitField.onChange(
                                                                v?.[0] ?? unitField.value,
                                                            )
                                                        }
                                                    >
                                                        {unitOptions}
                                                    </Select>
                                                )}
                                            />
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
                            <Text variant="body-1" className={b('label')}>
                                {i18n('field_load')}
                            </Text>

                            <Flex className={b('input')} gap="3" alignItems="center">
                                <Controller
                                    name="loadEnabled"
                                    control={control}
                                    render={({field}) => (
                                        <Switch checked={field.value} onUpdate={field.onChange} />
                                    )}
                                />

                                <Controller
                                    name="loadPercent"
                                    control={control}
                                    render={({field}) => (
                                        <TextInput
                                            type="number"
                                            value={String(field.value)}
                                            onUpdate={field.onChange}
                                            disabled={!loadEnabled}
                                            errorMessage={errors.loadPercent?.message}
                                            validationState={
                                                errors.loadPercent ? 'invalid' : undefined
                                            }
                                            endContent={<span className={b('postfix')}>%</span>}
                                        />
                                    )}
                                />
                            </Flex>
                        </Flex>

                        <Text variant="subheader-1" className={b('section-title')}>
                            {i18n('title_limits')}
                        </Text>

                        <Flex className={b('row')} gap="3" alignItems="center">
                            <Text variant="body-1" className={b('label')}>
                                {i18n('field_minimum')}
                            </Text>

                            <Controller
                                name="minimum"
                                control={control}
                                render={({field}) => (
                                    <TextInput
                                        type="number"
                                        value={String(field.value)}
                                        onUpdate={field.onChange}
                                        className={b('input')}
                                        errorMessage={errors.minimum?.message}
                                        validationState={errors.minimum ? 'invalid' : undefined}
                                    />
                                )}
                            />
                        </Flex>

                        <Flex className={b('row')} gap="3" alignItems="center">
                            <Text variant="body-1" className={b('label')}>
                                {i18n('field_maximum')}
                            </Text>

                            <Controller
                                name="maximum"
                                control={control}
                                render={({field}) => (
                                    <TextInput
                                        type="number"
                                        value={String(field.value)}
                                        onUpdate={field.onChange}
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
): Promise<ManagePartitioningValue | null> {
    return NiceModal.show(MANAGE_PARTITIONING_DIALOG, {
        id: MANAGE_PARTITIONING_DIALOG,
        ...props,
    }) as Promise<ManagePartitioningValue | null>;
}
