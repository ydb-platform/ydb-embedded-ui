import React from 'react';

import {Plus, TrashBin} from '@gravity-ui/icons';
import {Button, Icon, Select, TextInput} from '@gravity-ui/uikit';
import {Controller, useFieldArray, useFormContext, useWatch} from 'react-hook-form';

import {cn} from '../../../../utils/cn';
import {FormSection} from '../components/layout';
import i18n from '../i18n';
import type {DocumentFormValues} from '../types';

const b = cn('ydb-table-form-dialog');

export function DocumentIndexesSection() {
    const {control} = useFormContext<DocumentFormValues>();
    const {fields, append, remove} = useFieldArray({control, name: 'document.indexes'});
    const attributes = useWatch({control, name: 'document.attributes'});
    const options = React.useMemo(
        () =>
            Array.from(new Set(attributes.map(({name}) => name).filter(Boolean)), (name) => ({
                value: name,
                content: name,
            })),
        [attributes],
    );

    return (
        <FormSection title={i18n('label_indexes')}>
            <div className={b('indexes-table', {document: true})}>
                {fields.length > 0 ? (
                    <div className={b('indexes-head')}>
                        <div>{i18n('column_name')}</div>
                        <div>{i18n('field_partition-key')}</div>
                        <div>{i18n('field_sort-key')}</div>
                    </div>
                ) : null}
                {fields.map((item, index) => {
                    const label = (field: string) =>
                        i18n('field_document-index-control', {field, number: index + 1});
                    return (
                        <div key={item.id} className={b('indexes-row')}>
                            <Controller
                                control={control}
                                name={`document.indexes.${index}.name`}
                                rules={{deps: 'document.indexes'}}
                                render={({field, fieldState}) => (
                                    <TextInput
                                        controlRef={field.ref}
                                        controlProps={{'aria-label': label(i18n('column_name'))}}
                                        value={field.value}
                                        onUpdate={field.onChange}
                                        validationState={fieldState.invalid ? 'invalid' : undefined}
                                        errorMessage={fieldState.error?.message}
                                    />
                                )}
                            />
                            {(['partitionKey', 'sortKey'] as const).map((key) => (
                                <Controller
                                    key={key}
                                    control={control}
                                    name={`document.indexes.${index}.${key}`}
                                    rules={{deps: 'document.indexes'}}
                                    render={({field, fieldState}) => (
                                        <Select
                                            aria-label={label(
                                                key === 'sortKey'
                                                    ? i18n('field_sort-key')
                                                    : i18n('field_partition-key'),
                                            )}
                                            value={field.value ? [field.value] : []}
                                            options={options}
                                            hasClear={key === 'sortKey'}
                                            filterable={options.length > 9}
                                            onUpdate={([value]) => field.onChange(value ?? '')}
                                            validationState={
                                                fieldState.invalid ? 'invalid' : undefined
                                            }
                                            errorMessage={fieldState.error?.message}
                                            width="max"
                                        />
                                    )}
                                />
                            ))}
                            <Button
                                view="flat"
                                aria-label={label(i18n('action_delete'))}
                                onClick={() => remove(index)}
                            >
                                <Icon data={TrashBin} size={16} />
                            </Button>
                        </div>
                    );
                })}
                <div>
                    <Button onClick={() => append({name: '', partitionKey: ''})}>
                        <Icon data={Plus} size={16} />
                        {i18n('button_add-index')}
                    </Button>
                </div>
            </div>
        </FormSection>
    );
}
