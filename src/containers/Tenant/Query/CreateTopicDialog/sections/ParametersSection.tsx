import React from 'react';

import {
    Button,
    Dialog,
    Disclosure,
    Divider,
    NumberInput,
    SegmentedRadioGroup,
    Select,
    Slider,
    Switch,
    Text,
} from '@gravity-ui/uikit';
import {Controller, useFormContext} from 'react-hook-form';

import {formatBytes} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';
import {FormRow, IncompatibilityWarning} from '../FormRow';
import {
    AUTO_PARTITIONING_MODES,
    MB_PER_GB,
    RETENTION_HOURS_OPTIONS,
    STORAGE_LIMIT_MAX_GB,
    STORAGE_LIMIT_MIN_GB,
    STORAGE_LIMIT_STEP_GB,
    WRITE_QUOTAS_KB,
} from '../constants';
import i18n from '../i18n';
import type {CreateTopicFormValues} from '../schema';

const b = cn('ydb-create-topic-dialog');

const FIELD_WIDTH = 120;

const writeQuotaOptions = WRITE_QUOTAS_KB.map((kb) => ({
    content: formatBytes({value: kb * 1024, withSpeedLabel: true}),
    value: String(kb),
}));

const retentionHoursLabel = (h: (typeof RETENTION_HOURS_OPTIONS)[number]) => {
    if (h === 24) {
        return i18n('label_retention-period_24h');
    }
    if (h === 12) {
        return i18n('label_retention-period_12h');
    }
    if (h === 4) {
        return i18n('label_retention-period_4h');
    }
    return i18n('label_retention-period_1h');
};

const retentionHoursOptions = RETENTION_HOURS_OPTIONS.map((h) => ({
    content: retentionHoursLabel(h),
    value: String(h),
}));

const formatThroughput = (shards: number, writeQuotaKb: number) =>
    formatBytes({value: shards * writeQuotaKb * 1024, withSpeedLabel: true});

export function ParametersSection() {
    const {control, watch, setValue, getValues, formState} =
        useFormContext<CreateTopicFormValues>();
    const errors = formState.errors;

    const autoPartitioningEnabled = watch('autoPartitioning.enabled');
    const autoPartitioningMode = watch('autoPartitioning.mode');
    const retentionType = watch('retentionType');
    const writeQuota = watch('writeQuota');
    const shards = watch('shards');
    const minPartitions = watch('autoPartitioning.minPartitions');
    const maxPartitions = watch('autoPartitioning.maxPartitions');
    const storageLimitMb = watch('storageLimitMb');

    const autoPartitioningRestricted = retentionType === 'size';

    const [confirmOpen, setConfirmOpen] = React.useState(false);

    const handleAutoPartitioningToggle = React.useCallback(
        (next: boolean) => {
            if (!next) {
                setValue('autoPartitioning.enabled', false, {shouldValidate: true});
                return;
            }

            if (autoPartitioningMode === 'paused') {
                setValue('autoPartitioning.enabled', true, {shouldValidate: true});
                return;
            }

            setConfirmOpen(true);
        },
        [autoPartitioningMode, setValue],
    );

    const confirmEnableAutoPartitioning = React.useCallback(() => {
        setValue('autoPartitioning.enabled', true, {shouldValidate: true});
        setConfirmOpen(false);
    }, [setValue]);

    const cancelEnableAutoPartitioning = React.useCallback(() => {
        setConfirmOpen(false);
    }, []);

    const onShardsChange = React.useCallback(
        (next: number | null) => {
            const value = next ?? 1;
            setValue('shards', value, {shouldValidate: true});
            setValue('autoPartitioning.minPartitions', value, {shouldValidate: true});
            const currentMax = getValues('autoPartitioning.maxPartitions');
            if (currentMax && currentMax <= value) {
                setValue('autoPartitioning.maxPartitions', value + 1, {shouldValidate: true});
            }
        },
        [getValues, setValue],
    );

    const onMinPartitionsChange = React.useCallback(
        (next: number | null) => {
            const value = next ?? 1;
            setValue('autoPartitioning.minPartitions', value, {shouldValidate: true});
            setValue('shards', value, {shouldValidate: true});
            const currentMax = getValues('autoPartitioning.maxPartitions');
            if (currentMax && currentMax <= value) {
                setValue('autoPartitioning.maxPartitions', value + 1, {shouldValidate: true});
            }
        },
        [getValues, setValue],
    );

    const throughputText = React.useMemo(() => {
        if (autoPartitioningEnabled) {
            return i18n('label_throughput-info-range', {
                from: formatThroughput(minPartitions, writeQuota),
                to: formatThroughput(maxPartitions, writeQuota),
            });
        }
        return i18n('label_throughput-info', {
            speed: formatThroughput(shards, writeQuota),
        });
    }, [autoPartitioningEnabled, minPartitions, maxPartitions, shards, writeQuota]);

    const storageNoteText = React.useMemo(() => {
        const sizeGb = Math.round(storageLimitMb / MB_PER_GB);
        const totalGb = sizeGb * shards;
        return i18n('label_data-storage-note', {
            total: totalGb,
            size: sizeGb,
            count: shards,
        });
    }, [storageLimitMb, shards]);

    return (
        <div className={b('section')}>
            <Text variant="subheader-2" as="h3" className={b('section-title')}>
                {i18n('section_stream-parameters')}
            </Text>

            <FormRow
                title={i18n('label_shard-write-quota')}
                note={i18n('context_shards-write-quota')}
                htmlFor="create-topic-write-quota"
            >
                <Controller
                    name="writeQuota"
                    control={control}
                    render={({field}) => (
                        <Select
                            id="create-topic-write-quota"
                            value={[String(field.value)]}
                            onUpdate={(values) => field.onChange(Number(values[0]))}
                            options={writeQuotaOptions}
                            width={FIELD_WIDTH}
                        />
                    )}
                />
                <Text color="secondary" variant="caption-2">
                    {throughputText}
                </Text>
            </FormRow>

            <Divider className={b('divider')} />

            <FormRow
                title={i18n('label_auto-partitioning')}
                note={i18n('context_auto-partitioning')}
            >
                <div className={b('row-control-line')}>
                    <Switch
                        checked={autoPartitioningEnabled}
                        onUpdate={handleAutoPartitioningToggle}
                        disabled={autoPartitioningRestricted}
                    />
                    {autoPartitioningRestricted ? (
                        <IncompatibilityWarning
                            content={i18n('label_auto-partitioning-mode-restricted')}
                        />
                    ) : null}
                </div>
            </FormRow>

            {autoPartitioningEnabled ? (
                <React.Fragment>
                    <FormRow
                        title={i18n('label_shards')}
                        note={i18n('context_shards')}
                        htmlFor="create-topic-min-partitions"
                    >
                        <div className={b('row-control-line')}>
                            <Controller
                                name="autoPartitioning.minPartitions"
                                control={control}
                                render={({field}) => (
                                    <NumberInput
                                        id="create-topic-min-partitions"
                                        value={field.value}
                                        onUpdate={onMinPartitionsChange}
                                        onBlur={field.onBlur}
                                        min={1}
                                        hiddenControls
                                        style={{width: FIELD_WIDTH}}
                                        endContent={
                                            <span className={b('input-suffix')}>
                                                {i18n('label_min')}
                                            </span>
                                        }
                                        errorMessage={
                                            errors.autoPartitioning?.minPartitions?.message
                                        }
                                        validationState={
                                            errors.autoPartitioning?.minPartitions
                                                ? 'invalid'
                                                : undefined
                                        }
                                    />
                                )}
                            />
                            <Controller
                                name="autoPartitioning.maxPartitions"
                                control={control}
                                render={({field}) => (
                                    <NumberInput
                                        value={field.value}
                                        onUpdate={(next) => field.onChange(next ?? 1)}
                                        onBlur={field.onBlur}
                                        min={1}
                                        hiddenControls
                                        style={{width: FIELD_WIDTH}}
                                        endContent={
                                            <span className={b('input-suffix')}>
                                                {i18n('label_max')}
                                            </span>
                                        }
                                        errorMessage={
                                            errors.autoPartitioning?.maxPartitions?.message
                                        }
                                        validationState={
                                            errors.autoPartitioning?.maxPartitions
                                                ? 'invalid'
                                                : undefined
                                        }
                                    />
                                )}
                            />
                        </div>
                    </FormRow>
                    <Disclosure
                        arrowPosition="end"
                        summary={
                            <Text variant="subheader-1">
                                {i18n('label_auto-partitioning-settings')}
                            </Text>
                        }
                    >
                        <div className={b('section')}>
                            <FormRow
                                title={i18n('label_auto-partitioning-mode')}
                                note={i18n('context_auto-partitioning-mode')}
                            >
                                <Controller
                                    name="autoPartitioning.mode"
                                    control={control}
                                    render={({field}) => (
                                        <SegmentedRadioGroup
                                            value={field.value}
                                            onUpdate={field.onChange}
                                            disabled={autoPartitioningRestricted}
                                        >
                                            {AUTO_PARTITIONING_MODES.map((mode) => (
                                                <SegmentedRadioGroup.Option
                                                    key={mode}
                                                    value={mode}
                                                    disabled={autoPartitioningRestricted}
                                                >
                                                    {mode === 'scale-up'
                                                        ? i18n('label_auto-partitioning-scale-up')
                                                        : i18n('label_auto-partitioning-paused')}
                                                </SegmentedRadioGroup.Option>
                                            ))}
                                        </SegmentedRadioGroup>
                                    )}
                                />
                            </FormRow>
                            <FormRow
                                title={i18n('label_auto-partitioning-stabilization-window')}
                                note={i18n('context_auto-partitioning-stabilization-window')}
                                htmlFor="create-topic-stabilization-window"
                            >
                                <Controller
                                    name="autoPartitioning.stabilizationWindow"
                                    control={control}
                                    render={({field}) => (
                                        <NumberInput
                                            id="create-topic-stabilization-window"
                                            value={field.value}
                                            onUpdate={(next) => field.onChange(next ?? 1)}
                                            onBlur={field.onBlur}
                                            min={1}
                                            hiddenControls
                                            style={{width: FIELD_WIDTH}}
                                            endContent={
                                                <span className={b('input-suffix')}>
                                                    {i18n('unit_seconds-short')}
                                                </span>
                                            }
                                            errorMessage={
                                                errors.autoPartitioning?.stabilizationWindow
                                                    ?.message
                                            }
                                            validationState={
                                                errors.autoPartitioning?.stabilizationWindow
                                                    ? 'invalid'
                                                    : undefined
                                            }
                                        />
                                    )}
                                />
                            </FormRow>
                            <FormRow
                                title={i18n('label_auto-partitioning-up-utilization')}
                                note={i18n('context_auto-partitioning-up-utilization')}
                                htmlFor="create-topic-up-utilization"
                            >
                                <Controller
                                    name="autoPartitioning.upUtilization"
                                    control={control}
                                    render={({field}) => (
                                        <NumberInput
                                            id="create-topic-up-utilization"
                                            value={field.value}
                                            onUpdate={(next) => field.onChange(next ?? 1)}
                                            onBlur={field.onBlur}
                                            min={1}
                                            max={100}
                                            hiddenControls
                                            style={{width: FIELD_WIDTH}}
                                            endContent={
                                                <span className={b('input-suffix')}>
                                                    {i18n('unit_percent-short')}
                                                </span>
                                            }
                                            errorMessage={
                                                errors.autoPartitioning?.upUtilization?.message
                                            }
                                            validationState={
                                                errors.autoPartitioning?.upUtilization
                                                    ? 'invalid'
                                                    : undefined
                                            }
                                        />
                                    )}
                                />
                            </FormRow>
                        </div>
                    </Disclosure>
                </React.Fragment>
            ) : (
                <FormRow
                    title={i18n('label_shards')}
                    note={i18n('context_shards')}
                    htmlFor="create-topic-shards"
                >
                    <Controller
                        name="shards"
                        control={control}
                        render={({field}) => (
                            <NumberInput
                                id="create-topic-shards"
                                value={field.value}
                                onUpdate={onShardsChange}
                                onBlur={field.onBlur}
                                min={1}
                                hiddenControls
                                style={{width: FIELD_WIDTH}}
                                errorMessage={errors.shards?.message}
                                validationState={errors.shards ? 'invalid' : undefined}
                            />
                        )}
                    />
                    <Text color="secondary" variant="caption-2">
                        {i18n('label_shards-info')}
                    </Text>
                </FormRow>
            )}

            <Divider className={b('divider')} />

            <FormRow
                title={i18n('label_data-storage-options')}
                note={i18n('context_data-storage-options')}
            >
                <div className={b('row-control-line')}>
                    <Controller
                        name="retentionType"
                        control={control}
                        render={({field}) => (
                            <SegmentedRadioGroup value={field.value} onUpdate={field.onChange}>
                                <SegmentedRadioGroup.Option value="time">
                                    {i18n('label_data-storage-time-limit')}
                                </SegmentedRadioGroup.Option>
                                <SegmentedRadioGroup.Option
                                    value="size"
                                    disabled={autoPartitioningEnabled}
                                >
                                    {i18n('label_data-storage-size-limit')}
                                </SegmentedRadioGroup.Option>
                            </SegmentedRadioGroup>
                        )}
                    />
                    {autoPartitioningEnabled ? (
                        <IncompatibilityWarning
                            content={i18n('label_data-storage-options-restricted')}
                        />
                    ) : null}
                </div>
                {retentionType === 'time' ? (
                    <Controller
                        name="retentionHours"
                        control={control}
                        render={({field}) => (
                            <React.Fragment>
                                <Select
                                    value={[String(field.value)]}
                                    onUpdate={(values) => field.onChange(Number(values[0]))}
                                    options={retentionHoursOptions}
                                    width={FIELD_WIDTH}
                                />
                                {errors.retentionHours ? (
                                    <Text color="danger" variant="caption-2">
                                        {errors.retentionHours.message}
                                    </Text>
                                ) : null}
                            </React.Fragment>
                        )}
                    />
                ) : (
                    <React.Fragment>
                        <Controller
                            name="storageLimitMb"
                            control={control}
                            render={({field}) => (
                                <Slider
                                    value={Math.round(field.value / MB_PER_GB)}
                                    onUpdate={(value) => {
                                        const next = Array.isArray(value) ? value[0] : value;
                                        field.onChange(next * MB_PER_GB);
                                    }}
                                    min={STORAGE_LIMIT_MIN_GB}
                                    max={STORAGE_LIMIT_MAX_GB}
                                    step={STORAGE_LIMIT_STEP_GB}
                                    marks={[STORAGE_LIMIT_MIN_GB, STORAGE_LIMIT_MAX_GB]}
                                    markFormat={(v) => i18n('unit_gb', {value: v})}
                                    tooltipDisplay="auto"
                                    tooltipFormat={(v) => i18n('unit_gb', {value: v})}
                                />
                            )}
                        />
                        <Text color="secondary" variant="caption-2">
                            {storageNoteText}
                        </Text>
                    </React.Fragment>
                )}
            </FormRow>

            <Dialog open={confirmOpen} onClose={cancelEnableAutoPartitioning} size="s">
                <Dialog.Header caption={i18n('label_confirm-auto-partitioning-title')} />
                <Dialog.Body>
                    <Text>{i18n('label_confirm-auto-partitioning-message')}</Text>
                </Dialog.Body>
                <Dialog.Footer
                    renderButtons={() => (
                        <React.Fragment>
                            <Button view="flat" onClick={cancelEnableAutoPartitioning}>
                                {i18n('action_cancel')}
                            </Button>
                            <Button view="action" onClick={confirmEnableAutoPartitioning}>
                                {i18n('action_enable')}
                            </Button>
                        </React.Fragment>
                    )}
                />
            </Dialog>
        </div>
    );
}
