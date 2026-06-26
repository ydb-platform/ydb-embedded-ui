import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import type {DialogFooterProps} from '@gravity-ui/uikit';
import {Dialog, Flex, Switch, Text, TextInput} from '@gravity-ui/uikit';
import {Controller} from 'react-hook-form';

import {Loader} from '../../../../../../components/Loader';
import {configsApi} from '../../../../../../store/reducers/configs';
import {formatBytes} from '../../../../../../utils/bytesParsers';
import {cn} from '../../../../../../utils/cn';
import {prepareErrorMessage} from '../../../../../../utils/prepareErrorMessage';

import {SplitUnitSelect} from './SplitUnitSelect';
import {MANAGE_PARTITIONING_DIALOG, UNIT_OPTIONS} from './constants';
import i18n from './i18n';
import type {ManagePartitioningFormOutput, ManagePartitioningFormState} from './types';
import {useManagePartitioningForm} from './useManagePartitionForm';
import {getMaxSplitSizeBytes} from './utils';

import './ManagePartitioningDialog.scss';

const b = cn(MANAGE_PARTITIONING_DIALOG);

interface CommonDialogProps {
    initialValue?: ManagePartitioningFormState;
    database?: string;
    onApply?: (value: ManagePartitioningFormState) => void | Promise<void>;
}

interface ManagePartitioningDialogNiceModalProps extends CommonDialogProps, DialogFooterProps {
    onClose?: () => void;
}

interface ManagePartitioningDialogProps extends CommonDialogProps, DialogFooterProps {
    onClose: () => void;
    open: boolean;
}

interface ManagePartitioningDialogFormProps extends DialogFooterProps {
    onClose: () => void;
    initialValue?: ManagePartitioningFormState;
    onApply?: (value: ManagePartitioningFormState) => void | Promise<void>;
    maxSplitSizeBytes: number;
}

// The form is created only after the config-derived `maxSplitSizeBytes` is known.
// This guarantees react-hook-form initializes (and computes `isValid`) against the
// correct schema, so Apply is not left disabled on clusters with a larger
// ForceShardSplitDataSize when the current split size exceeds the 2 GiB fallback.
function ManagePartitioningDialogForm({
    onClose,
    renderButtons,
    initialValue,
    onApply,
    maxSplitSizeBytes,
}: ManagePartitioningDialogFormProps) {
    const [apiError, setApiError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const maxSplitSizeGb = React.useMemo(
        () =>
            formatBytes({
                value: maxSplitSizeBytes,
                size: 'gb',
                withSizeLabel: false,
            }),
        [maxSplitSizeBytes],
    );

    const {
        control,
        handleSubmit,
        trigger,
        formState: {errors, isValid},
    } = useManagePartitioningForm({
        initialValue,
        maxSplitSizeBytes,
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
                                        <Controller
                                            name="splitUnit"
                                            control={control}
                                            render={({field: unitField}) => (
                                                <SplitUnitSelect
                                                    value={unitField.value}
                                                    options={UNIT_OPTIONS}
                                                    onChange={(nextUnit) => {
                                                        unitField.onChange(nextUnit);
                                                        trigger('splitSize');
                                                    }}
                                                />
                                            )}
                                        />
                                    }
                                />
                            )}
                        />

                        <Text variant="body-1" className={b('hint')}>
                            {i18n('context_split-size-maximum', {
                                maxGb: maxSplitSizeGb,
                            })}
                        </Text>
                    </Flex>

                    <Flex className={b('row')} gap="3" alignItems="center">
                        <label htmlFor="loadEnabled" className={b('label')}>
                            {i18n('field_load')}
                        </label>

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
    );
}

function ManagePartitioningDialog({
    onClose,
    open,
    renderButtons,
    initialValue,
    database,
    onApply,
}: ManagePartitioningDialogProps) {
    const {currentData: config, isLoading} = configsApi.useGetConfigQuery({database});

    // Maximum split size is taken from the database config field
    // ImmediateControlsConfig.SchemeShardControls.ForceShardSplitDataSize
    // (falls back to the default 2 GiB when it is not present).
    const maxSplitSizeBytes = React.useMemo(() => getMaxSplitSizeBytes(config?.current), [config]);

    return (
        <Dialog size="s" onClose={onClose} open={open}>
            <Dialog.Header
                caption={<Text variant="subheader-3">{i18n('title_manage-partitioning')}</Text>}
            />

            {isLoading ? (
                <React.Fragment>
                    <Dialog.Body className={b('body')}>
                        <Flex className={b('loader')} justifyContent="center" alignItems="center">
                            <Loader size="m" />
                        </Flex>
                    </Dialog.Body>

                    <Dialog.Footer
                        textButtonApply={i18n('action_apply')}
                        textButtonCancel={i18n('action_cancel')}
                        onClickButtonCancel={onClose}
                        renderButtons={renderButtons}
                        propsButtonApply={{
                            // The form is not mounted yet (waiting for the config-derived limit),
                            // so Apply stays disabled until the real form takes over.
                            disabled: true,
                        }}
                    />
                </React.Fragment>
            ) : (
                <ManagePartitioningDialogForm
                    onClose={onClose}
                    renderButtons={renderButtons}
                    initialValue={initialValue}
                    onApply={onApply}
                    maxSplitSizeBytes={maxSplitSizeBytes}
                />
            )}
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
): Promise<ManagePartitioningFormOutput | null> {
    return NiceModal.show(MANAGE_PARTITIONING_DIALOG, {
        id: MANAGE_PARTITIONING_DIALOG,
        ...props,
    }) as Promise<ManagePartitioningFormOutput | null>;
}
