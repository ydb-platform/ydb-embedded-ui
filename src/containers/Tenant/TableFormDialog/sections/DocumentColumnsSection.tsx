import {Plus, TrashBin} from '@gravity-ui/icons';
import {Button, Checkbox, HelpMark, Icon, Select, TextInput} from '@gravity-ui/uikit';
import {Controller, useFieldArray, useFormContext, useWatch} from 'react-hook-form';

import {cn} from '../../../../utils/cn';
import {FormFieldError, FormSection} from '../components/layout';
import {DOCUMENT_ATTRIBUTE_TYPES} from '../constants';
import i18n from '../i18n';
import type {DocumentFormValues} from '../types';

const b = cn('ydb-table-form-dialog');
const typeOptions = DOCUMENT_ATTRIBUTE_TYPES.map((type) => ({value: type, content: type}));
const keyRoles = [
    {
        value: 'partition',
        label: i18n('field_partition-key'),
        help: i18n('context_document-partition-key'),
    },
    {value: 'sort', label: i18n('field_sort-key'), help: i18n('context_document-sort-key')},
] as const;

export function DocumentColumnsSection() {
    const {control, formState, setValue, trigger} = useFormContext<DocumentFormValues>();
    const {fields, append, remove} = useFieldArray({control, name: 'document.attributes'});
    const attributes = useWatch({control, name: 'document.attributes'});
    const errors = formState.errors.document?.attributes;

    const changeKey = (index: number, role: 'partition' | 'sort', checked: boolean) => {
        if (checked) {
            const previous = attributes.findIndex(({keyType}) => keyType === role);
            if (previous >= 0 && previous !== index) {
                setValue(`document.attributes.${previous}.keyType`, undefined, {shouldDirty: true});
            }
        }
        setValue(`document.attributes.${index}.keyType`, checked ? role : undefined, {
            shouldDirty: true,
        });
        trigger('document').catch(() => undefined);
    };

    return (
        <FormSection title={i18n('label_columns')}>
            <div className={b('columns-table', {'no-default': true})}>
                <div className={b('columns-head')}>
                    <div>{i18n('column_name')}</div>
                    <div>{i18n('column_type')}</div>
                    {keyRoles.map(({value, label, help}) => (
                        <div key={value} className={b('columns-head-cell')}>
                            {label}
                            <HelpMark
                                className={b('help-mark')}
                                popoverProps={{
                                    placement: ['bottom', 'top'],
                                    className: b('help-mark-popup'),
                                }}
                            >
                                {help}
                            </HelpMark>
                        </div>
                    ))}
                </div>
                {fields.map((attribute, index) => {
                    const label = (field: string) =>
                        i18n('field_document-column-control', {field, number: index + 1});
                    return (
                        <div className={b('columns-row')} key={attribute.id}>
                            <Controller
                                control={control}
                                name={`document.attributes.${index}.name`}
                                rules={{deps: 'document'}}
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
                            <Controller
                                control={control}
                                name={`document.attributes.${index}.type`}
                                render={({field}) => (
                                    <Select
                                        aria-label={label(i18n('column_type'))}
                                        value={[field.value]}
                                        options={typeOptions}
                                        onUpdate={([value]) => field.onChange(value)}
                                        width="max"
                                    />
                                )}
                            />
                            {keyRoles.map((role) => (
                                <div key={role.value} className={b('columns-cell', {key: true})}>
                                    <Checkbox
                                        size="l"
                                        controlProps={{'aria-label': label(role.label)}}
                                        checked={attributes[index]?.keyType === role.value}
                                        onUpdate={(checked) =>
                                            changeKey(index, role.value, checked)
                                        }
                                    />
                                </div>
                            ))}
                            {fields.length > 1 ? (
                                <Button
                                    view="flat"
                                    aria-label={label(i18n('action_delete'))}
                                    onClick={() => {
                                        remove(index);
                                        trigger('document').catch(() => undefined);
                                    }}
                                >
                                    <Icon data={TrashBin} size={16} />
                                </Button>
                            ) : null}
                        </div>
                    );
                })}
                <FormFieldError message={errors?.root?.message ?? errors?.message} />
                <div>
                    <Button onClick={() => append({name: '', type: 'String'})}>
                        <Icon data={Plus} size={16} />
                        {i18n('button_add-column')}
                    </Button>
                </div>
            </div>
        </FormSection>
    );
}
