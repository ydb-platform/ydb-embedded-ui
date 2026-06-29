import React from 'react';

import {Key, Plus, TrashBin} from '@gravity-ui/icons';
import {
    Button,
    Disclosure,
    HelpMark,
    Icon,
    SegmentedRadioGroup,
    Switch,
    Text,
    TextInput,
} from '@gravity-ui/uikit';
import {Controller, useFormContext, useWatch} from 'react-hook-form';

import type {ColumnValueField} from '../../../../store/reducers/table/types';
import {prepareColumnValue} from '../../../../store/reducers/table/utils';
import {cn} from '../../../../utils/cn';
import {RangeInputPicker} from '../components/RangeInputPicker';
import {FormFieldError, FormRow, FormSection} from '../components/layout';
import {MAX_PARTITION_SIZE_MB, MIN_PARTITION_SIZE_MB} from '../constants';
import i18n from '../i18n';
import type {ColumnField, FormMode, FormValues} from '../types';
import {PartitionsType} from '../types';
import {
    acceptIntegerInput,
    formatOptionalIntegerInput,
    parseOptionalIntegerInput,
    partitionsTypeOptions,
} from '../utils';

import type {SplitPointDialogState} from './SplitPointDialog';
import {SplitPointDialog, buildSplitPointEntries} from './SplitPointDialog';

const b = cn('ydb-table-form-dialog');

function formatPartitionSizeMark(value: number) {
    return `${value} ${i18n('value_megabyte')}`;
}

interface SettingsSectionProps {
    mode: FormMode;
}

export function SettingsSection({mode}: SettingsSectionProps) {
    const {control, setValue, getValues, trigger, formState} = useFormContext<FormValues>();

    const partitionsType = useWatch({control, name: 'settings.partitionsType'});
    const autoPartitionBySize = useWatch({control, name: 'settings.autoPartitionBySize'});
    const autoPartitionByLoad = useWatch({control, name: 'settings.autoPartitionByLoad'});
    const autoPartitionMinPartitions = useWatch({
        control,
        name: 'settings.autoPartitionMinPartitions',
    });
    const autoPartitionMaxPartitions = useWatch({
        control,
        name: 'settings.autoPartitionMaxPartitions',
    });

    const minMaxDisabled = !autoPartitionBySize && !autoPartitionByLoad;

    const uniformError = formState.errors.settings?.uniformPartitions?.message;
    const minPartitionsError = formState.errors.settings?.autoPartitionMinPartitions?.message;
    const maxPartitionsError = formState.errors.settings?.autoPartitionMaxPartitions?.message;
    const partitionsAtKeysError = formState.errors.settings?.partitionsAtKeys?.message;
    const [splitDialogState, setSplitDialogState] = React.useState<SplitPointDialogState>({
        open: false,
        index: 0,
        columns: [],
        values: [],
    });

    const splitPointsRaw = useWatch({control, name: 'settings.partitionsAtKeys'});
    const splitPoints = React.useMemo<ColumnValueField[][]>(
        () => splitPointsRaw ?? [],
        [splitPointsRaw],
    );

    const columns = useWatch({control, name: 'columns'});
    const splitPointPlaceholder = React.useMemo(() => {
        const pkNames = columns
            .filter(({key}) => Boolean(key))
            .map(({name}) => name)
            .join(', ');
        return pkNames ? `(${pkNames})` : '';
    }, [columns]);

    const appendSplit = React.useCallback(() => {
        const current = (getValues('settings.partitionsAtKeys') ?? []) as ColumnValueField[][];
        setValue('settings.partitionsAtKeys', [...current, []], {shouldValidate: true});
    }, [getValues, setValue]);

    const removeSplit = React.useCallback(
        (index: number) => {
            const current = (getValues('settings.partitionsAtKeys') ?? []) as ColumnValueField[][];
            setValue(
                'settings.partitionsAtKeys',
                current.filter((_, i) => i !== index),
                {shouldValidate: true},
            );
        },
        [getValues, setValue],
    );

    const openSplitDialog = React.useCallback(
        (index: number) => {
            const allColumns = getValues('columns') as ColumnField[];
            const pkColumns = allColumns.filter(({key}) => Boolean(key));
            const current = (getValues('settings.partitionsAtKeys') ?? []) as ColumnValueField[][];
            const stored = current[index] ?? [];
            const draftValues = buildSplitPointEntries(pkColumns, stored);
            setSplitDialogState({
                open: true,
                index,
                columns: pkColumns.map(({name, type, notNull}) => ({name, type, notNull})),
                values: draftValues,
            });
        },
        [getValues],
    );

    const closeSplitDialog = React.useCallback(() => {
        setSplitDialogState((prev) => ({...prev, open: false}));
    }, []);

    const handleSplitSubmit = React.useCallback(
        (index: number, values: ColumnValueField[]) => {
            const current = (getValues('settings.partitionsAtKeys') ?? []) as ColumnValueField[][];
            const next = current.map((row, i) => (i === index ? values : row));
            setValue('settings.partitionsAtKeys', next, {shouldValidate: true});
        },
        [getValues, setValue],
    );

    const handleAutoPartitionBySizeUpdate = React.useCallback(
        (enabled: boolean, onChange: (value: boolean) => void) => {
            if (enabled) {
                const currentSize = getValues('settings.autoPartitionBySizeMb');

                if (typeof currentSize !== 'number' || Number.isNaN(currentSize)) {
                    setValue('settings.autoPartitionBySizeMb', MAX_PARTITION_SIZE_MB, {
                        shouldDirty: true,
                        shouldValidate: true,
                    });
                }
            }

            onChange(enabled);
        },
        [getValues, setValue],
    );

    React.useEffect(() => {
        trigger([
            'settings.autoPartitionMinPartitions',
            'settings.autoPartitionMaxPartitions',
        ]).catch(() => undefined);
    }, [autoPartitionMaxPartitions, autoPartitionMinPartitions, trigger]);

    return (
        <React.Fragment>
            {mode === 'create' ? (
                <FormSection title={i18n('label_section-partition-policy')}>
                    <FormRow
                        title={i18n('field_partitions-type')}
                        note={i18n('tooltip_partitions-type')}
                    >
                        <Controller
                            control={control}
                            name="settings.partitionsType"
                            render={({field}) => (
                                <SegmentedRadioGroup
                                    value={field.value ?? PartitionsType.None}
                                    onUpdate={field.onChange}
                                >
                                    {partitionsTypeOptions.map((option) => (
                                        <SegmentedRadioGroup.Option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.content}
                                        </SegmentedRadioGroup.Option>
                                    ))}
                                </SegmentedRadioGroup>
                            )}
                        />
                    </FormRow>
                    {partitionsType === PartitionsType.Uniform ? (
                        <FormRow title={i18n('field_uniform-partitions')}>
                            <Controller
                                control={control}
                                name="settings.uniformPartitions"
                                render={({field}) => (
                                    <TextInput
                                        className={b('control')}
                                        value={formatOptionalIntegerInput(field.value)}
                                        onUpdate={(value) => {
                                            if (!acceptIntegerInput(value)) {
                                                return;
                                            }
                                            field.onChange(parseOptionalIntegerInput(value));
                                        }}
                                        validationState={uniformError ? 'invalid' : undefined}
                                        errorMessage={uniformError}
                                    />
                                )}
                            />
                        </FormRow>
                    ) : null}
                    {partitionsType === PartitionsType.Explicit ? (
                        <div className={b('split-points-field')}>
                            <div className={b('split-points-header')}>
                                <Text
                                    as="span"
                                    variant="body-1"
                                    className={b('split-points-title')}
                                >
                                    {i18n('field_explicit-partitions')}
                                </Text>
                                <HelpMark
                                    className={b('help-mark')}
                                    popoverProps={{
                                        placement: ['bottom', 'right'],
                                        className: b('help-mark-popup'),
                                    }}
                                >
                                    {i18n('tooltip_explicit-partitions')}
                                </HelpMark>
                            </div>
                            <div className={b('split-points-content')}>
                                <div className={b('split-points')}>
                                    {splitPoints.map((row, index) => {
                                        const display = row
                                            .map((column) =>
                                                prepareColumnValue(column, column.value),
                                            )
                                            .join(', ');
                                        return (
                                            <div
                                                key={`split-${index}`}
                                                className={b('split-point-row')}
                                            >
                                                <Text
                                                    as="span"
                                                    color="secondary"
                                                    className={b('split-point-index')}
                                                >
                                                    {`${index + 1}.`}
                                                </Text>
                                                <Button
                                                    view="outlined"
                                                    onClick={() => openSplitDialog(index)}
                                                    title={i18n('title_split-point')}
                                                >
                                                    <Icon data={Key} size={16} />
                                                </Button>
                                                <TextInput
                                                    className={b('split-point-display')}
                                                    value={display ? `(${display})` : ''}
                                                    placeholder={splitPointPlaceholder}
                                                    controlProps={{readOnly: true}}
                                                />
                                                {splitPoints.length > 1 ? (
                                                    <Button
                                                        view="flat"
                                                        onClick={() => removeSplit(index)}
                                                        title={i18n('action_delete')}
                                                    >
                                                        <Icon data={TrashBin} size={16} />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                    <FormFieldError message={partitionsAtKeysError} />
                                    <div>
                                        <Button onClick={appendSplit}>
                                            <Icon data={Plus} size={16} />
                                            {i18n('button_add-split-point')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </FormSection>
            ) : null}

            <FormSection
                title={i18n('label_section-autopartition')}
                note={i18n('tooltip_section-autopartition')}
            >
                <FormRow
                    title={i18n('field_autopartition-by-size')}
                    note={i18n('tooltip_autopartition-by-size')}
                >
                    <Controller
                        control={control}
                        name="settings.autoPartitionBySize"
                        render={({field}) => (
                            <div className={b('checkbox-control')}>
                                <Switch
                                    checked={Boolean(field.value)}
                                    onUpdate={(value) => {
                                        handleAutoPartitionBySizeUpdate(value, field.onChange);
                                    }}
                                />
                            </div>
                        )}
                    />
                </FormRow>
                <FormRow
                    title={i18n('field_autopartition-by-load')}
                    note={i18n('tooltip_autopartition-by-load')}
                >
                    <Controller
                        control={control}
                        name="settings.autoPartitionByLoad"
                        render={({field}) => (
                            <div className={b('checkbox-control')}>
                                <Switch checked={Boolean(field.value)} onUpdate={field.onChange} />
                            </div>
                        )}
                    />
                </FormRow>
                <Disclosure
                    summary={
                        <Text as="span" variant="subheader-2">
                            {i18n('label_section-advanced')}
                        </Text>
                    }
                    className={b('disclosure')}
                >
                    <div className={b('advanced')}>
                        <FormRow title={i18n('field_autopartition-by-size-mb')}>
                            <Controller
                                control={control}
                                name="settings.autoPartitionBySizeMb"
                                render={({field}) => {
                                    const value =
                                        typeof field.value === 'number' &&
                                        !Number.isNaN(field.value)
                                            ? field.value
                                            : undefined;

                                    return (
                                        <RangeInputPicker
                                            className={b('control')}
                                            value={value}
                                            min={MIN_PARTITION_SIZE_MB}
                                            max={MAX_PARTITION_SIZE_MB}
                                            step={1}
                                            marks={[MIN_PARTITION_SIZE_MB, MAX_PARTITION_SIZE_MB]}
                                            markFormat={formatPartitionSizeMark}
                                            onUpdate={field.onChange}
                                            acceptInputValue={acceptIntegerInput}
                                            parseInputValue={Number}
                                            disabled={!autoPartitionBySize}
                                            endContent={
                                                <span className={b('input-suffix')}>
                                                    {i18n('value_megabyte')}
                                                </span>
                                            }
                                        />
                                    );
                                }}
                            />
                        </FormRow>
                        <FormRow
                            title={i18n('field_autopartition-min')}
                            note={i18n('tooltip_autopartition-min')}
                        >
                            <Controller
                                control={control}
                                name="settings.autoPartitionMinPartitions"
                                render={({field}) => (
                                    <TextInput
                                        className={b('control')}
                                        value={formatOptionalIntegerInput(field.value)}
                                        onUpdate={(value) => {
                                            if (!acceptIntegerInput(value)) {
                                                return;
                                            }
                                            field.onChange(parseOptionalIntegerInput(value));
                                        }}
                                        disabled={minMaxDisabled}
                                        validationState={minPartitionsError ? 'invalid' : undefined}
                                        errorMessage={minPartitionsError}
                                    />
                                )}
                            />
                        </FormRow>
                        <FormRow
                            title={i18n('field_autopartition-max')}
                            note={i18n('tooltip_autopartition-max')}
                        >
                            <Controller
                                control={control}
                                name="settings.autoPartitionMaxPartitions"
                                render={({field}) => (
                                    <TextInput
                                        className={b('control')}
                                        value={formatOptionalIntegerInput(field.value)}
                                        onUpdate={(value) => {
                                            if (!acceptIntegerInput(value)) {
                                                return;
                                            }
                                            field.onChange(parseOptionalIntegerInput(value));
                                        }}
                                        disabled={minMaxDisabled}
                                        validationState={maxPartitionsError ? 'invalid' : undefined}
                                        errorMessage={maxPartitionsError}
                                    />
                                )}
                            />
                        </FormRow>
                        <FormRow
                            title={i18n('field_key-bloom-filter')}
                            note={i18n('tooltip_key-bloom-filter')}
                        >
                            <Controller
                                control={control}
                                name="settings.keyBloomFilter"
                                render={({field}) => (
                                    <div className={b('checkbox-control')}>
                                        <Switch
                                            checked={Boolean(field.value)}
                                            onUpdate={field.onChange}
                                        />
                                    </div>
                                )}
                            />
                        </FormRow>
                    </div>
                </Disclosure>
            </FormSection>

            <SplitPointDialog
                state={splitDialogState}
                onClose={closeSplitDialog}
                onSubmit={handleSplitSubmit}
            />
        </React.Fragment>
    );
}
