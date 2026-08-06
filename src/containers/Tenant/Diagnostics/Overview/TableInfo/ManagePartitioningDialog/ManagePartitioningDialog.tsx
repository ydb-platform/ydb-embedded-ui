import React from 'react';

import * as NiceModal from '@ebay/nice-modal-react';
import type {DialogFooterProps} from '@gravity-ui/uikit';
import {Dialog, Flex, Switch, Text, TextInput} from '@gravity-ui/uikit';
import {Controller} from 'react-hook-form';

import {Loader} from '../../../../../../components/Loader';
import {configsApi} from '../../../../../../store/reducers/configs';
import {cn} from '../../../../../../utils/cn';
import {formatNumber} from '../../../../../../utils/dataFormatters/dataFormatters';
import {prepareErrorMessage} from '../../../../../../utils/prepareErrorMessage';

import {SplitUnitSelect} from './SplitUnitSelect';
import {MANAGE_PARTITIONING_DIALOG, UNIT_OPTIONS} from './constants';
import i18n from './i18n';
import type {ManagePartitioningFormOutput, ManagePartitioningFormState} from './types';
import {useManagePartitioningForm} from './useManagePartitionForm';
import {getMaxSplitSizeBytes, getMaxSplitSizeGb} from './utils';

import './ManagePartitioningDialog.scss';

const b = cn(MANAGE_PARTITIONING_DIALOG);

interface CommonDialogProps {
    initialValue?: ManagePartitioningFormState;
    database?: string;
    // The form output is produced after Zod coercion, so numeric fields are
    // numbers (ManagePartitioningFormOutput), not the raw string form state.
    onApply?: (value: ManagePartitioningFormOutput) => void | Promise<void>;
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
    onApply?: (value: ManagePartitioningFormOutput) => void | Promise<void>;
    maxSplitSizeBytes?: number;
}

// The form is created only after the config request resolves and the limit is
// either known or unavailable. This guarantees react-hook-form initializes (and
// computes `isValid`) against the correct schema.
function ManagePartitioningDialogForm({
    onClose,
    renderButtons,
    initialValue,
    onApply,
    maxSplitSizeBytes,
}: ManagePartitioningDialogFormProps) {
    const [apiError, setApiError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // When available, the displayed maximum is floored to match the exact byte
    // limit used by validation. Rounding could show a value that gets rejected.
    const maxSplitSizeGb = React.useMemo(
        () => (maxSplitSizeBytes === undefined ? undefined : getMaxSplitSizeGb(maxSplitSizeBytes)),
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

                        {typeof maxSplitSizeBytes === 'number' ? (
                            <Text
                                variant="body-1"
                                className={b('hint')}
                                title={i18n('context_split-size-maximum-bytes', {
                                    bytes: formatNumber(maxSplitSizeBytes),
                                })}
                            >
                                {i18n('context_split-size-maximum', {
                                    maxGb: maxSplitSizeGb,
                                })}
                            </Text>
                        ) : null}
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
                    className: 'brand-button',
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
    const {currentData: config, isLoading, isError} = configsApi.useGetConfigQuery({database});

    // Maximum split size is taken from the database config field
    // ImmediateControlsConfig.SchemeShardControls.ForceShardSplitDataSize
    // (falls back to the default 2 GiB when it is not present). If the config
    // request fails, the limit is unknown and must not be enforced in the UI.
    const maxSplitSizeBytes = React.useMemo(
        () => (isError ? undefined : getMaxSplitSizeBytes(config?.current)),
        [config, isError],
    );

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
                            className: 'brand-button',
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
