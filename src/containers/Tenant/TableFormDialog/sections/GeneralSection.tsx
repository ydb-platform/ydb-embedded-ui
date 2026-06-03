import React from 'react';

import type {SelectOption} from '@gravity-ui/uikit';
import {Select, Text, TextInput} from '@gravity-ui/uikit';
import {Controller, useFormContext, useWatch} from 'react-hook-form';

import {cn} from '../../../../utils/cn';
import {FormRow, FormSection} from '../components/layout';
import i18n from '../i18n';
import type {FormMode, FormValues, TableType} from '../types';

const b = cn('ydb-table-form-dialog');

interface GeneralSectionProps {
    mode: FormMode;
    insidePath?: string;
    nameInputRef?: React.Ref<HTMLInputElement>;
}

const tableTypeInfo: Record<TableType, string> = {
    row: i18n('label_info-table-type_row'),
    column: i18n('label_info-table-type_column'),
};

export function GeneralSection({mode, insidePath, nameInputRef}: GeneralSectionProps) {
    const {control, formState} = useFormContext<FormValues>();
    const type = useWatch({control, name: 'type'});

    const typeOptions = React.useMemo<SelectOption[]>(
        () => [
            {value: 'row', content: i18n('label_row-table')},
            {value: 'column', content: i18n('label_column-table')},
        ],
        [],
    );

    const nameError = formState.errors.name?.message;
    const nameDisabled = mode === 'update' && type === 'column';
    const typeDisabled = mode === 'update';

    return (
        <FormSection title={i18n('label_section-general')}>
            {insidePath ? (
                <FormRow title={i18n('field_inside')}>
                    <Text as="div" className={b('fixed-value')}>
                        {`${insidePath}/`}
                    </Text>
                </FormRow>
            ) : null}
            <FormRow title={i18n('field_name')} required htmlFor="table-form-name">
                <Controller
                    control={control}
                    name="name"
                    render={({field}) => (
                        <TextInput
                            controlRef={nameInputRef}
                            id="table-form-name"
                            value={field.value ?? ''}
                            onUpdate={field.onChange}
                            autoComplete={false}
                            disabled={nameDisabled}
                            validationState={nameError ? 'invalid' : undefined}
                            errorMessage={nameError}
                            className={b('control')}
                            autoFocus={mode === 'create'}
                        />
                    )}
                />
            </FormRow>
            <FormRow title={i18n('field_type')}>
                <div className={b('control-stack')}>
                    <Controller
                        control={control}
                        name="type"
                        render={({field}) => (
                            <Select
                                value={field.value ? [field.value] : []}
                                options={typeOptions}
                                onUpdate={([value]) => field.onChange(value)}
                                disabled={typeDisabled}
                                width="max"
                                className={b('control')}
                            />
                        )}
                    />
                    {mode === 'create' && type && tableTypeInfo[type] ? (
                        <Text as="div" color="secondary" className={b('table-type-info')}>
                            {tableTypeInfo[type]}
                        </Text>
                    ) : null}
                </div>
            </FormRow>
        </FormSection>
    );
}
