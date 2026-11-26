import React from 'react';

import type {SelectOption} from '@gravity-ui/uikit';
import {HelpMark, Select, TextInput} from '@gravity-ui/uikit';
import {Controller, useFormContext, useWatch} from 'react-hook-form';

import {cn} from '../../../../utils/cn';
import tenantKeyset from '../../i18n';
import {FormRow, FormSection} from '../components/layout';
import i18n from '../i18n';
import type {DialogFormValues, FormMode, TableType} from '../types';
import {getCreateInitialValues} from '../utils';

const b = cn('ydb-table-form-dialog');

interface GeneralSectionProps {
    mode: FormMode;
    availableTypes: readonly TableType[];
    nameInputRef?: React.Ref<HTMLInputElement>;
}

const tableTypeInfo: Record<TableType, string> = {
    row: i18n('label_info-table-type_row'),
    column: i18n('label_info-table-type_column'),
    document: i18n('context_document-table-type'),
};

export function GeneralSection({mode, nameInputRef, availableTypes}: GeneralSectionProps) {
    const {control, formState, getValues, reset} = useFormContext<DialogFormValues>();
    const type = useWatch({control, name: 'type'});

    const typeOptions = React.useMemo<SelectOption[]>(
        () =>
            availableTypes.map((value) => ({
                value,
                content:
                    value === 'document'
                        ? tenantKeyset('value_document-table')
                        : i18n(`label_${value}-table`),
            })),
        [availableTypes],
    );

    const nameError = formState.errors.name?.message;
    const nameDisabled = mode === 'update' && type === 'column';
    const typeDisabled = mode === 'update' || typeOptions.length < 2;
    const tableTypeHelpText =
        mode === 'create' && availableTypes.length ? tableTypeInfo[type] : undefined;
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
                                value={availableTypes.length ? [field.value] : []}
                                options={typeOptions}
                                onUpdate={([value]) => {
                                    const nextType = availableTypes.find(
                                        (option) => option === value,
                                    );
                                    if (!nextType || nextType === type) {
                                        return;
                                    }
                                    if (type === 'document' || nextType === 'document') {
                                        reset({
                                            ...getCreateInitialValues(nextType),
                                            name: getValues('name'),
                                        });
                                    } else {
                                        field.onChange(nextType);
                                    }
                                }}
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
