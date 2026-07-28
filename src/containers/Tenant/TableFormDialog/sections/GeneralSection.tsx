import React from 'react';

import type {SelectOption} from '@gravity-ui/uikit';
import {HelpMark, Select, TextInput} from '@gravity-ui/uikit';
import {Controller, useFormContext, useWatch} from 'react-hook-form';

import {cn} from '../../../../utils/cn';
import {FormRow, FormSection} from '../components/layout';
import i18n from '../i18n';
import type {FormMode, FormValues, TableType} from '../types';

const b = cn('ydb-table-form-dialog');

interface GeneralSectionProps {
    mode: FormMode;
    nameInputRef?: React.Ref<HTMLInputElement>;
}

const tableTypeInfo: Record<TableType, string> = {
    row: i18n('label_info-table-type_row'),
    column: i18n('label_info-table-type_column'),
};

export function GeneralSection({mode, nameInputRef}: GeneralSectionProps) {
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
    const tableTypeHelpText = mode === 'create' && type ? tableTypeInfo[type] : undefined;
    const nameHelpText = nameDisabled ? undefined : i18n('context_field-name');

    return (
        <FormSection>
            <FormRow title={i18n('field_name')} note={nameHelpText} htmlFor="table-form-name">
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
                <div className={b('type-select-row')}>
                    <Controller
                        control={control}
                        name="type"
                        render={({field}) => (
                            <Select
                                className={b('type-select-control')}
                                value={field.value ? [field.value] : []}
                                options={typeOptions}
                                onUpdate={([value]) => field.onChange(value)}
                                disabled={typeDisabled}
                                width="max"
                            />
                        )}
                    />
                    {tableTypeHelpText ? (
                        <HelpMark
                            className={b('help-mark')}
                            popoverProps={{
                                placement: ['bottom', 'right'],
                                className: b('help-mark-popup'),
                            }}
                        >
                            {tableTypeHelpText}
                        </HelpMark>
                    ) : null}
                </div>
            </FormRow>
        </FormSection>
    );
}
