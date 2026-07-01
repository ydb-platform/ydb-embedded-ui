import React from 'react';

import {TextInput} from '@gravity-ui/uikit';
import {Controller, useFormContext, useWatch} from 'react-hook-form';

import {cn} from '../../../../utils/cn';
import {ColumnSelectorField} from '../components/ColumnSelectorField';
import {FormFieldError, FormRow, FormSection} from '../components/layout';
import i18n from '../i18n';
import type {FormValues} from '../types';
import {acceptIntegerInput, formatOptionalIntegerInput, parseOptionalIntegerInput} from '../utils';

const b = cn('ydb-table-form-dialog');

interface PartitioningSectionProps {
    pkTypes: Set<string>;
}

export function PartitioningSection({pkTypes}: PartitioningSectionProps) {
    const {control, formState} = useFormContext<FormValues>();
    const columns = useWatch({control, name: 'columns'});

    const pkColumns = React.useMemo(
        () => columns.filter(({key, type}) => key && pkTypes.has(type)),
        [columns, pkTypes],
    );

    const partitionKeyError = formState.errors.partitionKey?.message;
    const partitionCountError = formState.errors.partitionCount?.message;

    return (
        <FormSection title={i18n('label_partitioning')}>
            <FormRow title={i18n('field_partition-key')}>
                <Controller
                    control={control}
                    name="partitionKey"
                    render={({field}) => (
                        <div className={b('control-stack')}>
                            <ColumnSelectorField
                                value={field.value ?? []}
                                onChange={field.onChange}
                                columns={pkColumns}
                                invalid={Boolean(partitionKeyError)}
                                className={b('control')}
                            />
                            <FormFieldError message={partitionKeyError} />
                        </div>
                    )}
                />
            </FormRow>
            <FormRow title={i18n('field_partition-count')}>
                <Controller
                    control={control}
                    name="partitionCount"
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
                            validationState={partitionCountError ? 'invalid' : undefined}
                            errorMessage={partitionCountError}
                        />
                    )}
                />
            </FormRow>
        </FormSection>
    );
}
