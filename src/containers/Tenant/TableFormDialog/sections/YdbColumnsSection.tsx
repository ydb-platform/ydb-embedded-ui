import React from 'react';

import {ArrowUturnCcwLeft, Plus, TrashBin} from '@gravity-ui/icons';
import type {SelectOption} from '@gravity-ui/uikit';
import {
    Button,
    Checkbox,
    HelpMark,
    Icon,
    Popover,
    Select,
    Text,
    TextInput,
} from '@gravity-ui/uikit';
import {Controller, useFieldArray, useFormContext, useWatch} from 'react-hook-form';

import {cn} from '../../../../utils/cn';
import {FormFieldError, FormSection} from '../components/layout';
import i18n from '../i18n';
import type {Column, FormMode, FormValues, OriginalTableInfo} from '../types';
import {
    generateColumnId,
    getAutoincrementDisabledMessage,
    getNotNullDisabledMessage,
    isSerialCompatible,
} from '../utils';

const b = cn('ydb-table-form-dialog');

interface YdbColumnsSectionProps {
    mode: FormMode;
    types: string[];
    pkTypes: Set<string>;
    keyNullable: boolean;
    originalInfo?: OriginalTableInfo;
}

export function YdbColumnsSection({
    mode,
    types,
    pkTypes,
    keyNullable,
    originalInfo,
}: YdbColumnsSectionProps) {
    const {control, setValue, formState} = useFormContext<FormValues>();
    const {fields, append, remove} = useFieldArray({control, name: 'columns'});
    const {
        fields: deletedFields,
        append: appendDeleted,
        remove: removeDeleted,
    } = useFieldArray({control, name: 'deletedColumns', keyName: 'rhfKey'});

    const columnsFieldError = formState.errors.columns as
        | {message?: string; root?: {message?: string}}
        | undefined;
    const columnsError = columnsFieldError?.root?.message ?? columnsFieldError?.message;

    const originalColumns = React.useMemo(
        () => originalInfo?.columns ?? [],
        [originalInfo?.columns],
    );
    const primaryOriginalColumns = React.useMemo(
        () => originalColumns.filter((column) => column.key),
        [originalColumns],
    );
    const nonPrimaryOriginalColumns = React.useMemo(
        () => originalColumns.filter((column) => !column.key),
        [originalColumns],
    );

    const typeOptions = React.useMemo<SelectOption[]>(
        () => types.map((type) => ({value: type, content: type})),
        [types],
    );

    const handleAddColumn = React.useCallback(() => {
        append({
            _id: generateColumnId(),
            name: '',
            type: 'Utf8',
            notNull: false,
            defaultValue: '',
            withDefaultValue: false,
        });
    }, [append]);

    const handleTypeChange = React.useCallback(
        (index: number, nextType: string | undefined) => {
            if (!nextType) {
                return;
            }
            if (!pkTypes.has(nextType)) {
                setValue(`columns.${index}.key`, false, {shouldValidate: true});
            }
            if (!isSerialCompatible(nextType)) {
                setValue(`columns.${index}.autoincrement`, false, {shouldValidate: true});
            }
        },
        [pkTypes, setValue],
    );

    const handleKeyChange = React.useCallback(
        (index: number, nextKey: boolean) => {
            if (!keyNullable && nextKey) {
                setValue(`columns.${index}.notNull`, true, {shouldValidate: true});
            }
            if (!nextKey) {
                setValue(`columns.${index}.autoincrement`, false, {shouldValidate: true});
            }
        },
        [keyNullable, setValue],
    );

    const handleAutoincrementChange = React.useCallback(
        (index: number, value: boolean) => {
            if (value) {
                setValue(`columns.${index}.notNull`, true, {shouldValidate: true});
            }
        },
        [setValue],
    );

    const handleDeleteOriginalColumn = React.useCallback(
        (column: Column) => {
            appendDeleted(column);
        },
        [appendDeleted],
    );

    const showHeader =
        fields.length > 0 ||
        primaryOriginalColumns.length > 0 ||
        nonPrimaryOriginalColumns.length > 0;

    const currentTtlColumn = originalInfo?.ttlColumn;
    const indexedColumns = React.useMemo(() => {
        const columns = new Set<string>();

        originalInfo?.indexes.forEach((index) => {
            index.columns.forEach((column) => {
                columns.add(column);
            });
        });

        return columns;
    }, [originalInfo?.indexes]);
    const primaryKeyColumnNames = primaryOriginalColumns.map((column) => column.name);
    const partitionKeyColumnNames = originalInfo?.partitionKey ?? [];

    return (
        <FormSection title={i18n('label_columns')}>
            {mode === 'update' ? (
                <div className={b('special-columns')}>
                    <SpecialColumnLabel
                        label={i18n('column_primary-key')}
                        columns={primaryKeyColumnNames}
                    />
                    {originalInfo?.type === 'column' ? (
                        <SpecialColumnLabel
                            label={i18n('field_partition-key')}
                            columns={partitionKeyColumnNames}
                        />
                    ) : null}
                </div>
            ) : null}
            <div className={b('columns-table', {update: mode === 'update'})}>
                {showHeader ? (
                    <React.Fragment>
                        <div className={b('columns-head')}>
                            <div className={b('columns-head-cell')}>{i18n('column_name')}</div>
                            <div className={b('columns-head-cell')}>{i18n('column_type')}</div>
                            {mode === 'create' ? (
                                <div className={b('columns-head-cell')}>
                                    {i18n('column_primary-key')}
                                    <HelpMark
                                        className={b('help-mark')}
                                        popoverProps={{
                                            placement: ['bottom', 'top'],
                                            className: b('help-mark-popup'),
                                        }}
                                    >
                                        {i18n('tooltip_primary-key')}
                                    </HelpMark>
                                </div>
                            ) : null}
                            <div className={b('columns-head-cell')}>{i18n('column_not-null')}</div>
                            <div className={b('columns-head-cell')}>{i18n('column_default')}</div>
                            <div />
                        </div>
                        <hr className={b('columns-separator')} />
                    </React.Fragment>
                ) : null}

                {mode === 'update' && primaryOriginalColumns.length > 0 ? (
                    <React.Fragment>
                        {primaryOriginalColumns.map((column) => (
                            <PrimaryColumnRow key={`pk-${column.name}`} column={column} />
                        ))}
                        <hr className={b('columns-separator')} />
                    </React.Fragment>
                ) : null}

                {mode === 'update' && nonPrimaryOriginalColumns.length > 0 ? (
                    <React.Fragment>
                        {nonPrimaryOriginalColumns.map((column) => {
                            const deletedIndex = deletedFields.findIndex(
                                (deleted) => deleted.name === column.name,
                            );
                            const isDeleting = deletedIndex >= 0;
                            return (
                                <NonPrimaryColumnRow
                                    key={`existing-${column.name}`}
                                    column={column}
                                    isDeleting={isDeleting}
                                    deleteDisabledMessage={getDeleteDisabledMessage({
                                        columnName: column.name,
                                        currentTtlColumn,
                                        indexedColumns,
                                    })}
                                    onDelete={() => handleDeleteOriginalColumn(column)}
                                    onUndo={() => removeDeleted(deletedIndex)}
                                />
                            );
                        })}
                        <hr className={b('columns-separator')} />
                    </React.Fragment>
                ) : null}

                {fields.map((field, index) => (
                    <EditableColumnRow
                        key={field.id}
                        index={index}
                        mode={mode}
                        typeOptions={typeOptions}
                        pkTypes={pkTypes}
                        keyNullable={keyNullable}
                        onTypeChange={(value) => handleTypeChange(index, value)}
                        onKeyChange={(value) => handleKeyChange(index, value)}
                        onAutoincrementChange={(value) => handleAutoincrementChange(index, value)}
                        onRemove={() => remove(index)}
                    />
                ))}

                <FormFieldError message={columnsError} />

                <div>
                    <Button onClick={handleAddColumn}>
                        <Icon data={Plus} size={16} />
                        {i18n('button_add-column')}
                    </Button>
                </div>
            </div>
        </FormSection>
    );
}

function ActionButtonWithPopover({
    content,
    children,
}: {
    content?: string;
    children: React.ReactElement;
}) {
    if (!content) {
        return children;
    }

    return (
        <Popover content={content} placement="top" hasArrow className={b('ttl-delete-popover')}>
            <span className={b('columns-action-popover-target')}>{children}</span>
        </Popover>
    );
}

function getDeleteDisabledMessage({
    columnName,
    currentTtlColumn,
    indexedColumns,
}: {
    columnName: string;
    currentTtlColumn?: string;
    indexedColumns: Set<string>;
}) {
    const messages: string[] = [];

    if (currentTtlColumn === columnName) {
        messages.push(i18n('tooltip_ttl-delete-disabled'));
    }

    if (indexedColumns.has(columnName)) {
        messages.push(i18n('tooltip_index-delete-disabled'));
    }

    return messages.join(' ');
}

function SpecialColumnLabel({label, columns}: {label: string; columns: string[]}) {
    if (!columns.length) {
        return null;
    }
    return (
        <div className={b('special-column')}>
            <span className={b('special-column-label')}>{label}:</span> {columns.join(', ')}
        </div>
    );
}

function formatDefaultValue(column: Column) {
    if (column.autoincrement) {
        return i18n('label_autoincrement');
    }

    if (typeof column.defaultValue === 'undefined') {
        return '';
    }

    return String(column.defaultValue);
}

function PrimaryColumnRow({column}: {column: Column}) {
    return (
        <div className={b('columns-row', {readonly: true})}>
            <div className={b('columns-cell', {name: true})}>{column.name}</div>
            <div className={b('columns-cell', {type: true})}>{column.type}</div>
            <div className={b('columns-cell', {'not-null': true})}>
                {column.notNull ? i18n('value_yes') : i18n('value_no')}
            </div>
            <div className={b('columns-cell', {default: true})}>{formatDefaultValue(column)}</div>
            <div />
        </div>
    );
}

function NonPrimaryColumnRow({
    column,
    isDeleting,
    deleteDisabledMessage,
    onDelete,
    onUndo,
}: {
    column: Column;
    isDeleting: boolean;
    deleteDisabledMessage?: string;
    onDelete: () => void;
    onUndo: () => void;
}) {
    return (
        <div className={b('columns-row', {readonly: true, deleting: isDeleting})}>
            <div className={b('columns-cell', {name: true})}>{column.name}</div>
            <div className={b('columns-cell', {type: true})}>{column.type}</div>
            <div className={b('columns-cell', {'not-null': true})}>
                {column.notNull ? i18n('value_yes') : i18n('value_no')}
            </div>
            <div className={b('columns-cell', {default: true})}>{formatDefaultValue(column)}</div>
            <div className={b('columns-cell', {action: true})}>
                {isDeleting ? (
                    <Button view="flat" size="m" onClick={onUndo} title={i18n('action_undo')}>
                        <Icon data={ArrowUturnCcwLeft} size={16} />
                    </Button>
                ) : (
                    <ActionButtonWithPopover content={deleteDisabledMessage}>
                        <Button
                            view="flat"
                            size="m"
                            onClick={onDelete}
                            disabled={Boolean(deleteDisabledMessage)}
                            title={deleteDisabledMessage ?? i18n('action_delete')}
                        >
                            <Icon data={TrashBin} size={16} />
                        </Button>
                    </ActionButtonWithPopover>
                )}
            </div>
        </div>
    );
}

interface EditableColumnRowProps {
    index: number;
    mode: FormMode;
    typeOptions: SelectOption[];
    pkTypes: Set<string>;
    keyNullable: boolean;
    onTypeChange: (value: string | undefined) => void;
    onKeyChange: (value: boolean) => void;
    onAutoincrementChange: (value: boolean) => void;
    onRemove: () => void;
}

function EditableColumnRow({
    index,
    mode,
    typeOptions,
    pkTypes,
    keyNullable,
    onTypeChange,
    onKeyChange,
    onAutoincrementChange,
    onRemove,
}: EditableColumnRowProps) {
    const {control, clearErrors, formState, setValue, trigger} = useFormContext<FormValues>();
    const column = useWatch({control, name: `columns.${index}`});
    const defaultValueFieldName = `columns.${index}.defaultValue` as const;
    const revalidateColumns = React.useCallback(() => {
        trigger('columns').catch(() => undefined);
    }, [trigger]);
    const handleDefaultValueUpdate = React.useCallback(
        (value: string) => {
            setValue(defaultValueFieldName, value, {
                shouldDirty: true,
                shouldValidate: false,
            });
            clearErrors(defaultValueFieldName);
        },
        [clearErrors, defaultValueFieldName, setValue],
    );

    const columnErrors = formState.errors.columns?.[index] as
        | {
              name?: {message?: string};
              type?: {message?: string};
              defaultValue?: {message?: string};
          }
        | undefined;
    const nameError = columnErrors?.name?.message;
    const typeError = columnErrors?.type?.message;
    const defaultValueError = columnErrors?.defaultValue?.message;
    const notNullDisabledMessage = getNotNullDisabledMessage(column, keyNullable);
    const autoincrementDisabledMessage = getAutoincrementDisabledMessage(column);
    const keyDisabled = !pkTypes.has(column.type);
    let defaultValueControl: React.ReactNode = null;

    if (mode === 'create') {
        if (column.key) {
            defaultValueControl = (
                <div className={b('checkbox-control')}>
                    <Controller
                        control={control}
                        name={`columns.${index}.autoincrement`}
                        render={({field}) => (
                            <Checkbox
                                size="l"
                                checked={Boolean(field.value)}
                                disabled={Boolean(autoincrementDisabledMessage)}
                                title={autoincrementDisabledMessage}
                                onUpdate={(value) => {
                                    field.onChange(value);
                                    onAutoincrementChange(value);
                                }}
                            >
                                <Text variant="body-1">{i18n('label_autoincrement')}</Text>
                            </Checkbox>
                        )}
                    />
                </div>
            );
        } else {
            defaultValueControl = (
                <div className={b('default-row')}>
                    <div className={b('default-value-toggle')}>
                        <Controller
                            control={control}
                            name={`columns.${index}.withDefaultValue`}
                            render={({field}) => (
                                <Checkbox
                                    size="l"
                                    checked={Boolean(field.value)}
                                    onUpdate={field.onChange}
                                />
                            )}
                        />
                    </div>
                    <div className={b('default-value-input')}>
                        <Controller
                            control={control}
                            name={`columns.${index}.defaultValue`}
                            render={({field}) => (
                                <TextInput
                                    value={field.value === undefined ? '' : String(field.value)}
                                    onUpdate={handleDefaultValueUpdate}
                                    onBlur={() => {
                                        field.onBlur();
                                        trigger(defaultValueFieldName).catch(() => undefined);
                                    }}
                                    disabled={!column.withDefaultValue}
                                    validationState={defaultValueError ? 'invalid' : undefined}
                                />
                            )}
                        />
                    </div>
                    {defaultValueError ? (
                        <div className={b('default-value-error')}>
                            <FormFieldError message={defaultValueError} />
                        </div>
                    ) : null}
                </div>
            );
        }
    }

    return (
        <div className={b('columns-row')}>
            <div className={b('columns-cell', {name: true})}>
                <Controller
                    control={control}
                    name={`columns.${index}.name`}
                    render={({field}) => (
                        <TextInput
                            value={field.value ?? ''}
                            onUpdate={field.onChange}
                            validationState={nameError ? 'invalid' : undefined}
                            errorMessage={nameError}
                            autoComplete={false}
                        />
                    )}
                />
            </div>
            <div className={b('columns-cell', {type: true})}>
                <Controller
                    control={control}
                    name={`columns.${index}.type`}
                    render={({field}) => (
                        <Select
                            value={field.value ? [field.value] : []}
                            options={typeOptions}
                            filterable={typeOptions.length > 9}
                            width="max"
                            popupClassName={b('columns-type-popup')}
                            onUpdate={([value]) => {
                                field.onChange(value);
                                onTypeChange(value);
                                revalidateColumns();
                            }}
                            validationState={typeError ? 'invalid' : undefined}
                        />
                    )}
                />
            </div>
            {mode === 'create' ? (
                <div className={b('columns-cell', {key: true})}>
                    <Controller
                        control={control}
                        name={`columns.${index}.key`}
                        render={({field}) => (
                            <Checkbox
                                size="l"
                                checked={Boolean(field.value)}
                                disabled={keyDisabled}
                                onUpdate={(value) => {
                                    field.onChange(value);
                                    onKeyChange(value);
                                    revalidateColumns();
                                }}
                            />
                        )}
                    />
                </div>
            ) : null}
            <div className={b('columns-cell', {'not-null': true})}>
                {mode === 'create' ? (
                    <Controller
                        control={control}
                        name={`columns.${index}.notNull`}
                        render={({field}) => (
                            <Checkbox
                                size="l"
                                checked={Boolean(field.value)}
                                disabled={Boolean(notNullDisabledMessage)}
                                title={notNullDisabledMessage}
                                onUpdate={field.onChange}
                            />
                        )}
                    />
                ) : null}
            </div>
            <div className={b('columns-cell', {default: true})}>{defaultValueControl}</div>
            <div className={b('columns-cell', {action: true})}>
                <Button
                    view="flat"
                    size="m"
                    onClick={() => {
                        onRemove();
                        revalidateColumns();
                    }}
                    title={i18n('action_delete')}
                >
                    <Icon data={TrashBin} size={16} />
                </Button>
            </div>
        </div>
    );
}
