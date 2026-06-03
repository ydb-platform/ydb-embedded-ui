import React from 'react';

import type {SelectOption} from '@gravity-ui/uikit';
import {SegmentedRadioGroup, Select, TextInput} from '@gravity-ui/uikit';
import {Controller, useFormContext, useWatch} from 'react-hook-form';

import {cn} from '../../../../utils/cn';
import {FormFieldError, FormRow, FormSection} from '../components/layout';
import i18n from '../i18n';
import type {FormValues, OriginalTableInfo} from '../types';
import {
    acceptIntegerInput,
    epochModeOptions,
    formatOptionalIntegerInput,
    isValidTtlNumType,
    isValidTtlType,
    lifetimeUnitOptions,
    parseOptionalIntegerInput,
    ttlStatusOptions,
} from '../utils';

const b = cn('ydb-table-form-dialog');

function formatEpochModeValue(value: string) {
    const normalized = value
        .replace(/^UNIT_/, '')
        .toLowerCase()
        .replace(/_/g, ' ');

    return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : value;
}

interface TTLSectionProps {
    originalInfo?: OriginalTableInfo;
}

export function TTLSection({originalInfo}: TTLSectionProps) {
    const {control, setValue, formState} = useFormContext<FormValues>();

    const status = useWatch({control, name: 'settings.ttl.status'});
    const column = useWatch({control, name: 'settings.ttl.column'});
    const columnWithEpochMode = useWatch({control, name: 'settings.ttl.columnWithEpochMode'});
    const formColumns = useWatch({control, name: 'columns'});
    const deletedColumns = useWatch({control, name: 'deletedColumns'});

    const enabled = status === 'enabled';
    const isEpochMode = Boolean(columnWithEpochMode);

    const ttlColumns = React.useMemo(() => {
        const deletedNames = new Set(deletedColumns.map(({name}) => name));
        const combined = [...(originalInfo?.columns ?? []), ...formColumns];
        return combined.filter(
            ({name, type}) => name && isValidTtlType(type) && !deletedNames.has(name),
        );
    }, [originalInfo, formColumns, deletedColumns]);

    const columnOptions = React.useMemo<SelectOption[]>(
        () =>
            ttlColumns.length === 0
                ? [
                      {
                          value: '',
                          content: i18n('label_ttl-warning'),
                          disabled: true,
                      },
                  ]
                : ttlColumns.map(({name}) => ({value: name, content: name})),
        [ttlColumns],
    );

    const renderEpochModeSelectedOption = React.useCallback(
        (option: SelectOption) => (
            <React.Fragment>{option.content ?? formatEpochModeValue(option.value)}</React.Fragment>
        ),
        [],
    );

    React.useEffect(() => {
        if (!enabled || !column) {
            return;
        }

        const matchedType = ttlColumns.find(({name}) => name === column)?.type;
        if (!matchedType) {
            return;
        }

        const withEpochMode = isValidTtlNumType(matchedType);
        setValue('settings.ttl.columnWithEpochMode', withEpochMode, {shouldValidate: false});
        if (!withEpochMode) {
            setValue('settings.ttl.epochMode', undefined, {shouldValidate: false});
        }
    }, [enabled, column, ttlColumns, setValue]);

    const columnError = formState.errors.settings?.ttl?.column?.message;
    const epochError = formState.errors.settings?.ttl?.epochMode?.message;
    const lifetimeError = formState.errors.settings?.ttl?.lifetime?.message;

    return (
        <FormSection title={i18n('label_section-ttl')} note={i18n('tooltip_section-ttl')}>
            <FormRow title={i18n('field_ttl-status')}>
                <Controller
                    control={control}
                    name="settings.ttl.status"
                    render={({field}) => (
                        <SegmentedRadioGroup
                            value={field.value}
                            onUpdate={(value) => field.onChange(value)}
                        >
                            {ttlStatusOptions.map((option) => (
                                <SegmentedRadioGroup.Option key={option.value} value={option.value}>
                                    {option.content}
                                </SegmentedRadioGroup.Option>
                            ))}
                        </SegmentedRadioGroup>
                    )}
                />
            </FormRow>
            {enabled ? (
                <React.Fragment>
                    <FormRow
                        title={i18n('field_ttl-column')}
                        note={i18n('tooltip_ttl-column')}
                        required
                    >
                        <Controller
                            control={control}
                            name="settings.ttl.column"
                            render={({field}) => (
                                <div className={b('control-stack')}>
                                    <Select
                                        className={b('control')}
                                        value={field.value ? [field.value] : []}
                                        options={columnOptions}
                                        placeholder={i18n('action_select')}
                                        onUpdate={([value]) => field.onChange(value)}
                                        width="max"
                                        validationState={columnError ? 'invalid' : undefined}
                                    />
                                    <FormFieldError message={columnError} />
                                </div>
                            )}
                        />
                    </FormRow>
                    {isEpochMode ? (
                        <FormRow
                            title={i18n('field_ttl-unit')}
                            note={i18n('tooltip_ttl-unit')}
                            required
                        >
                            <Controller
                                control={control}
                                name="settings.ttl.epochMode"
                                render={({field}) => (
                                    <div className={b('control-stack')}>
                                        <Select
                                            className={b('control')}
                                            value={field.value ? [field.value] : []}
                                            options={epochModeOptions}
                                            onUpdate={([value]) => field.onChange(value)}
                                            width="max"
                                            validationState={epochError ? 'invalid' : undefined}
                                            renderSelectedOption={renderEpochModeSelectedOption}
                                        />
                                        <FormFieldError message={epochError} />
                                    </div>
                                )}
                            />
                        </FormRow>
                    ) : null}
                    <FormRow
                        title={i18n('field_ttl-lifetime')}
                        note={i18n('tooltip_ttl-lifetime')}
                        required
                    >
                        <div className={b('ttl-lifetime')}>
                            <Controller
                                control={control}
                                name="settings.ttl.lifetime"
                                render={({field}) => (
                                    <TextInput
                                        className={b('ttl-lifetime-input')}
                                        value={formatOptionalIntegerInput(field.value)}
                                        onUpdate={(value) => {
                                            if (!acceptIntegerInput(value)) {
                                                return;
                                            }
                                            field.onChange(parseOptionalIntegerInput(value));
                                        }}
                                        validationState={lifetimeError ? 'invalid' : undefined}
                                        errorMessage={lifetimeError}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="settings.ttl.unit"
                                render={({field}) => (
                                    <Select
                                        className={b('ttl-lifetime-select')}
                                        value={field.value ? [field.value] : ['seconds']}
                                        options={lifetimeUnitOptions}
                                        onUpdate={([value]) => field.onChange(value)}
                                    />
                                )}
                            />
                        </div>
                    </FormRow>
                </React.Fragment>
            ) : null}
        </FormSection>
    );
}
