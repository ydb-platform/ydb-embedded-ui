import React from 'react';

import {Plus, TrashBin} from '@gravity-ui/icons';
import {Button, HelpMark, Icon, TextInput} from '@gravity-ui/uikit';
import {Controller, useFieldArray, useFormContext, useWatch} from 'react-hook-form';

import {cn} from '../../../../utils/cn';
import {ColumnSelectorField} from '../components/ColumnSelectorField';
import {FormFieldError, FormSection} from '../components/layout';
import {YDB_PK_TYPES} from '../constants';
import i18n from '../i18n';
import type {Column, FormValues} from '../types';

const b = cn('ydb-table-form-dialog');

export function YdbIndexesSection() {
    const {control, formState} = useFormContext<FormValues>();
    const {
        fields: newIndexFields,
        append,
        remove,
    } = useFieldArray({
        control,
        name: 'secondaryIndexes',
    });
    const formColumns = useWatch({control, name: 'columns'});

    const availableColumns = React.useMemo<Column[]>(() => {
        return formColumns.filter(({name, type}) => Boolean(name) && YDB_PK_TYPES.has(type));
    }, [formColumns]);

    const hasAnyIndex = newIndexFields.length > 0;

    const handleAddIndex = React.useCallback(() => {
        append({name: '', key: []});
    }, [append]);

    return (
        <FormSection title={i18n('label_indexes')}>
            <div className={b('indexes-table')}>
                {hasAnyIndex ? (
                    <div className={b('indexes-head')}>
                        <div>{i18n('column_name')}</div>
                        <div className={b('columns-head-cell')}>
                            {i18n('column_index-key')}
                            <HelpMark
                                className={b('help-mark')}
                                popoverProps={{
                                    placement: ['bottom', 'top'],
                                    className: b('help-mark-popup'),
                                }}
                            >
                                {i18n('tooltip_index-key')}
                            </HelpMark>
                        </div>
                        <div />
                    </div>
                ) : null}

                {newIndexFields.map((field, index) => {
                    const nameError = formState.errors.secondaryIndexes?.[index]?.name?.message;
                    const keyError = formState.errors.secondaryIndexes?.[index]?.key?.message;
                    return (
                        <div key={field.id} className={b('indexes-row')}>
                            <div className={b('indexes-cell', {name: true})}>
                                <Controller
                                    control={control}
                                    name={`secondaryIndexes.${index}.name`}
                                    render={({field: nameField}) => (
                                        <TextInput
                                            className={b('control')}
                                            value={nameField.value ?? ''}
                                            onUpdate={nameField.onChange}
                                            validationState={nameError ? 'invalid' : undefined}
                                            errorMessage={nameError}
                                        />
                                    )}
                                />
                            </div>
                            <div className={b('indexes-cell', {key: true})}>
                                <Controller
                                    control={control}
                                    name={`secondaryIndexes.${index}.key`}
                                    render={({field: keyField}) => (
                                        <div className={b('control-stack')}>
                                            <ColumnSelectorField
                                                value={keyField.value ?? []}
                                                onChange={keyField.onChange}
                                                columns={availableColumns}
                                                invalid={Boolean(keyError)}
                                                className={b('control')}
                                            />
                                            <FormFieldError message={keyError} />
                                        </div>
                                    )}
                                />
                            </div>
                            <div className={b('indexes-cell', {action: true})}>
                                <Button
                                    view="flat"
                                    size="m"
                                    onClick={() => remove(index)}
                                    title={i18n('action_delete')}
                                >
                                    <Icon data={TrashBin} size={16} />
                                </Button>
                            </div>
                        </div>
                    );
                })}

                <div>
                    <Button onClick={handleAddIndex}>
                        <Icon data={Plus} size={16} />
                        {i18n('button_add-index')}
                    </Button>
                </div>
            </div>
        </FormSection>
    );
}
