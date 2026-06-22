import React from 'react';

import {ChevronDown, Xmark} from '@gravity-ui/icons';
import {Button, Icon, Label, List, Popup} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import i18n from '../i18n';
import type {Column} from '../types';

import './ColumnSelectorField.scss';

interface ColumnSelectorFieldProps {
    value: string[];
    onChange: (value: string[]) => void;
    columns: Column[];
    invalid?: boolean;
    className?: string;
}

const b = cn('ydb-table-form-column-selector');

const getColumnId = (item: Column) => item.name;

const filterColumnItem = (filter: string) => (item: Column) => {
    const lower = filter.toLowerCase();
    return item.name.toLowerCase().includes(lower);
};

interface ItemSelectorProps {
    items: Column[];
    value: string[];
    onUpdate: (value: string[]) => void;
}

function ItemSelector({items, value, onUpdate}: ItemSelectorProps) {
    const valueSet = React.useMemo(() => new Set(value), [value]);
    const availableItems = React.useMemo(
        () => items.filter((item) => !valueSet.has(getColumnId(item))),
        [items, valueSet],
    );
    const selectedItems = React.useMemo(
        () =>
            value
                .map((id) => items.find((item) => getColumnId(item) === id))
                .filter(Boolean) as Column[],
        [value, items],
    );

    const handleSelect = React.useCallback(
        (item: Column) => {
            const id = getColumnId(item);
            if (!valueSet.has(id)) {
                onUpdate([...value, id]);
            }
        },
        [onUpdate, value, valueSet],
    );

    const handleRemove = React.useCallback(
        (item: Column) => {
            onUpdate(value.filter((v) => v !== getColumnId(item)));
        },
        [onUpdate, value],
    );

    const handleSelectAll = React.useCallback(() => {
        onUpdate(items.map(getColumnId));
    }, [items, onUpdate]);

    const handleClear = React.useCallback(() => {
        onUpdate([]);
    }, [onUpdate]);

    const renderAvailableItem = React.useCallback(
        (item: Column, isActive: boolean) => (
            <div className={b('selector-item')}>
                <span className={b('selector-item-text')}>{item.name}</span>
                <Button
                    view="flat-secondary"
                    size="s"
                    className={b('selector-item-action', {visible: isActive})}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(item);
                    }}
                >
                    {i18n('action_select')}
                </Button>
            </div>
        ),
        [handleSelect],
    );

    const renderSelectedItem = React.useCallback(
        (item: Column, isActive: boolean) => (
            <div className={b('selector-item')}>
                <span className={b('selector-item-text')}>{item.name}</span>
                <Button
                    view="flat-secondary"
                    size="s"
                    className={b('selector-item-action', {visible: isActive})}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item);
                    }}
                >
                    <Icon data={Xmark} size={14} />
                </Button>
            </div>
        ),
        [handleRemove],
    );

    return (
        <div className={b('panels')}>
            <div className={b('panel')}>
                <div className={b('panel-header')}>
                    <span className={b('panel-title')}>{i18n('label_columns')}</span>
                    <Button view="flat-secondary" size="s" onClick={handleSelectAll}>
                        {i18n('action_select-all')}
                    </Button>
                </div>
                <List<Column>
                    items={availableItems}
                    filterItem={filterColumnItem}
                    filterPlaceholder={i18n('label_search')}
                    itemsHeight={196}
                    renderItem={renderAvailableItem}
                />
            </div>
            <div className={b('panel')}>
                <div className={b('panel-header')}>
                    <span className={b('panel-title')}>
                        {i18n('label_selected-count', {count: selectedItems.length})}
                    </span>
                    <Button view="flat-secondary" size="s" onClick={handleClear}>
                        {i18n('action_clear')}
                    </Button>
                </div>
                <List<Column>
                    items={selectedItems}
                    filterItem={filterColumnItem}
                    filterPlaceholder={i18n('label_search')}
                    itemsHeight={196}
                    renderItem={renderSelectedItem}
                />
            </div>
        </div>
    );
}

export function ColumnSelectorField({
    value,
    onChange,
    columns,
    invalid,
    className,
}: ColumnSelectorFieldProps) {
    const [open, setOpen] = React.useState(false);
    const [currentValue, setCurrentValue] = React.useState<string[] | undefined>(undefined);
    const controlRef = React.useRef<HTMLButtonElement>(null);

    const items = React.useMemo(() => columns.filter(({name}) => Boolean(name)), [columns]);

    React.useEffect(() => {
        setCurrentValue(undefined);
    }, [value, columns]);

    React.useEffect(() => {
        if (!value.length) {
            return;
        }
        const available = new Set(items.map(getColumnId));
        const allPresent = value.every((id) => available.has(id));
        if (!allPresent) {
            onChange(value.filter((id) => available.has(id)));
        }
    }, [items, value, onChange]);

    const handleToggle = React.useCallback(() => {
        setOpen((prev) => !prev);
        setCurrentValue(undefined);
    }, []);

    const handleApply = React.useCallback(() => {
        setOpen(false);
        if (currentValue !== undefined) {
            onChange(currentValue);
        }
        setCurrentValue(undefined);
    }, [currentValue, onChange]);

    const handleCancel = React.useCallback(() => {
        setOpen(false);
        setCurrentValue(undefined);
    }, []);

    return (
        <div className={b(null, className)}>
            <button
                ref={controlRef}
                type="button"
                className={b('control', {open, invalid})}
                onClick={handleToggle}
            >
                {value.length > 0 ? (
                    <span className={b('value')}>{value.join(', ')}</span>
                ) : (
                    <span className={b('placeholder')}>{i18n('label_select-columns')}</span>
                )}
                {value.length > 0 ? (
                    <Label size="xs" className={b('badge')}>
                        {value.length}
                    </Label>
                ) : null}
                <Icon data={ChevronDown} className={b('chevron', {open})} size={16} />
            </button>
            <Popup
                anchorElement={controlRef.current}
                placement={['bottom-start', 'bottom-end', 'top-start', 'top-end']}
                open={open}
                onOutsideClick={handleCancel}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        handleCancel();
                    }
                }}
            >
                <ItemSelector
                    items={items}
                    value={currentValue ?? value}
                    onUpdate={setCurrentValue}
                />
                <div className={b('popup-controls')}>
                    <Button view="flat" onClick={handleCancel}>
                        {i18n('action_cancel')}
                    </Button>
                    <Button view="action" onClick={handleApply}>
                        {i18n('action_apply')}
                    </Button>
                </div>
            </Popup>
        </div>
    );
}
