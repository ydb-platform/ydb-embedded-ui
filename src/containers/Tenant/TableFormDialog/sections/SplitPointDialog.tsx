import React from 'react';

import {Checkbox, Dialog, HelpMark, Label, TextArea, TextInput} from '@gravity-ui/uikit';

import type {ColumnValueField} from '../../../../store/reducers/table/types';
import {cn} from '../../../../utils/cn';
import {isValueForTypeValid} from '../columnValueValidation';
import {SPLIT_POINT_STRING_TYPES} from '../constants';
import i18n from '../i18n';
import type {Column, ColumnField} from '../types';
import {generateColumnId, getColumnTypeDescription} from '../utils';

const b = cn('ydb-table-form-dialog');

interface SplitPointDraftRow {
    column: Column;
    id: string;
    isDefined: boolean;
    value: string;
}

export interface SplitPointDialogState {
    open: boolean;
    index: number;
    columns: Column[];
    values: SplitPointDraftRow[];
}

interface SplitPointDialogProps {
    state: SplitPointDialogState;
    onClose: () => void;
    onSubmit: (index: number, values: ColumnValueField[]) => void;
}

function isColumnValueMustBeDefined(column: Column) {
    return !column.autoincrement;
}

function getNotDefinedValue(column: Column) {
    const fallback = column.autoincrement ? 'AUTO INCREMENT' : 'NULL';
    return column.defaultValue === undefined ? fallback : String(column.defaultValue);
}

function isRowInvalid(row: SplitPointDraftRow) {
    return row.isDefined && !isValueForTypeValid(row.value, row.column.type);
}

function SplitPointValueControl({
    row,
    invalid,
    errorMessage,
    isStringType,
    onChange,
    onBlur,
}: {
    row: SplitPointDraftRow;
    invalid: boolean;
    errorMessage?: string;
    isStringType: boolean;
    onChange: (id: string, value: string) => void;
    onBlur: (id: string) => void;
}) {
    if (!row.isDefined) {
        const notDefinedValue = getNotDefinedValue(row.column);
        return (
            <TextInput
                className={b('split-point-input', {null: notDefinedValue === 'NULL'})}
                value={notDefinedValue}
                disabled
            />
        );
    }

    if (isStringType) {
        return (
            <TextArea
                className={b('split-point-input')}
                value={row.value}
                onUpdate={(value) => onChange(row.id, value)}
                onBlur={() => onBlur(row.id)}
                minRows={1}
                validationState={invalid ? 'invalid' : undefined}
                errorMessage={errorMessage}
            />
        );
    }

    return (
        <TextInput
            className={b('split-point-input')}
            value={row.value}
            onUpdate={(value) => onChange(row.id, value)}
            onBlur={() => onBlur(row.id)}
            validationState={invalid ? 'invalid' : undefined}
            errorMessage={errorMessage}
        />
    );
}

export function SplitPointDialog({state, onClose, onSubmit}: SplitPointDialogProps) {
    const [draftValues, setDraftValues] = React.useState(state.values);
    const [touched, setTouched] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        setDraftValues(state.values);
        setTouched({});
    }, [state.values]);

    const handleChange = (id: string, value: string) => {
        setDraftValues((prev) => prev.map((row) => (row.id === id ? {...row, value} : row)));
    };

    const handleBlur = (id: string) => {
        setTouched((prev) => ({...prev, [id]: true}));
    };

    const handleToggleDefined = (id: string, isDefined: boolean) => {
        setDraftValues((prev) => prev.map((row) => (row.id === id ? {...row, isDefined} : row)));
    };

    const markAllTouched = React.useCallback(() => {
        setTouched(Object.fromEntries(draftValues.map((row) => [row.id, true] as const)));
    }, [draftValues]);

    const hasErrors = draftValues.some(isRowInvalid);

    const handleSubmit = () => {
        if (hasErrors) {
            markAllTouched();
            return;
        }

        onSubmit(
            state.index,
            draftValues.map((row) => ({
                id: row.id,
                isDefined: row.isDefined,
                value: row.isDefined ? row.value : null,
                name: row.column.name,
                type: row.column.type,
                notNull: row.column.notNull,
            })),
        );
        onClose();
    };

    const primaryKeyNames = state.columns.map((column) => column.name).join(', ');

    return (
        <Dialog open={state.open} onClose={onClose} size="s" disableHeightTransition>
            <Dialog.Header caption={i18n('title_split-point')} />
            <Dialog.Body className={b('split-point-body')}>
                {primaryKeyNames ? (
                    <div className={b('split-point-pk')}>
                        <span className={b('split-point-pk-label')}>
                            {i18n('column_primary-key')}:
                        </span>{' '}
                        <span>{primaryKeyNames}</span>
                    </div>
                ) : null}
                <div className={b('split-point-fields')}>
                    {draftValues.map((row) => {
                        const {type} = row.column;
                        const typeDescription = getColumnTypeDescription(type);
                        const isStringType = SPLIT_POINT_STRING_TYPES.has(type);
                        const showDefinedToggle = !isColumnValueMustBeDefined(row.column);
                        const invalid = Boolean(touched[row.id]) && isRowInvalid(row);
                        const errorMessage = invalid ? i18n('error_value-invalid') : undefined;

                        return (
                            <div key={row.id} className={b('split-point-dialog-row')}>
                                <div className={b('split-point-meta')}>
                                    <div className={b('split-point-label')}>
                                        <span>{row.column.name}</span>
                                        <span className={b('split-point-type')}>({type})</span>
                                        {typeDescription ? (
                                            <HelpMark
                                                className={b('help-mark')}
                                                popoverProps={{
                                                    placement: ['bottom', 'right'],
                                                    className: b('help-mark-popup'),
                                                }}
                                            >
                                                {typeDescription}
                                            </HelpMark>
                                        ) : null}
                                        {row.column.notNull ? (
                                            <Label theme="unknown" className={b('not-null-label')}>
                                                NOT NULL
                                            </Label>
                                        ) : null}
                                    </div>
                                </div>
                                <div className={b('split-point-control')}>
                                    {showDefinedToggle ? (
                                        <div className={b('split-point-toggle')}>
                                            <Checkbox
                                                checked={row.isDefined}
                                                onUpdate={(checked) =>
                                                    handleToggleDefined(row.id, checked)
                                                }
                                            >
                                                {i18n('action_set-value')}
                                            </Checkbox>
                                        </div>
                                    ) : null}
                                    <SplitPointValueControl
                                        row={row}
                                        invalid={invalid}
                                        errorMessage={errorMessage}
                                        isStringType={isStringType}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Dialog.Body>
            <Dialog.Footer
                textButtonApply={i18n('action_add')}
                textButtonCancel={i18n('action_cancel')}
                onClickButtonApply={handleSubmit}
                onClickButtonCancel={onClose}
            />
        </Dialog>
    );
}

export function buildSplitPointEntries(
    pkColumns: ColumnField[],
    storedValues: ColumnValueField[] | undefined,
): SplitPointDraftRow[] {
    return pkColumns.map((column, idx) => {
        const stored = storedValues?.[idx];
        return {
            column: {
                name: column.name,
                type: column.type,
                notNull: column.notNull,
                key: column.key,
                autoincrement: column.autoincrement,
                defaultValue: column.defaultValue,
            },
            id: stored?.id ?? generateColumnId(),
            isDefined: isColumnValueMustBeDefined(column),
            value:
                stored?.value === null || stored?.value === undefined ? '' : String(stored.value),
        };
    });
}
