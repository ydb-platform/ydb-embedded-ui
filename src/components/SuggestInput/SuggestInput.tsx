import React from 'react';

import type {TextInputProps} from '@gravity-ui/uikit';
import {Popup, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './SuggestInput.scss';

const b = cn('ydb-suggest-input');

export interface SuggestInputItem {
    /** Text that replaces the input value when the item is selected */
    value: string;
    /** Item content, `value` is rendered by default */
    content?: React.ReactNode;
}

export interface SuggestInputProps extends Omit<TextInputProps, 'value' | 'onUpdate'> {
    value: string;
    onUpdate: (value: string) => void;
    /**
     * Items to show under the input. The component doesn't filter them:
     * pass the items that are relevant for the current value.
     */
    suggestions?: SuggestInputItem[];
    /** Called when the user picks an item. By default the input value is replaced with `item.value` */
    onSuggestionSelect?: (item: SuggestInputItem) => void;
    /**
     * Show suggestions as soon as the input gets focus.
     * By default they appear only after the user starts typing or presses an arrow key.
     */
    openOnFocus?: boolean;
    popupClassName?: string;
}

/**
 * Text input with optional suggestions.
 * The user can pick one of the suggested values or keep typing their own.
 */
export function SuggestInput({
    value,
    onUpdate,
    suggestions = [],
    onSuggestionSelect,
    openOnFocus = false,
    popupClassName,
    className,
    onFocus,
    onBlur,
    onKeyDown,
    controlProps,
    ...inputProps
}: SuggestInputProps) {
    const listId = React.useId();
    const [anchor, setAnchor] = React.useState<HTMLSpanElement | null>(null);
    const [focused, setFocused] = React.useState(false);
    const [requested, setRequested] = React.useState(false);
    // The first item is highlighted by default, so that Enter picks it instead of submitting the form
    const [activeIndex, setActiveIndex] = React.useState(0);

    const open = focused && requested && suggestions.length > 0;
    const activeItem =
        open && activeIndex < suggestions.length ? suggestions[activeIndex] : undefined;

    const getItemId = (index: number) => `${listId}-item-${index}`;

    const handleUpdate = (updated: string) => {
        setRequested(true);
        setActiveIndex(0);
        onUpdate(updated);
    };

    const handleSelect = (item: SuggestInputItem) => {
        // Keep the list open to show what can follow the selected value
        setRequested(true);
        setActiveIndex(0);
        if (onSuggestionSelect) {
            onSuggestionSelect(item);
        } else {
            onUpdate(item.value);
        }
    };

    const moveActive = (step: 1 | -1) => {
        setActiveIndex((current) => {
            const count = suggestions.length;
            if (current >= count) {
                return step === 1 ? 0 : count - 1;
            }
            return (current + step + count) % count;
        });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
            return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (suggestions.length === 0) {
                return;
            }
            event.preventDefault();
            if (open) {
                moveActive(event.key === 'ArrowDown' ? 1 : -1);
            } else {
                setRequested(true);
                setActiveIndex(event.key === 'ArrowDown' ? 0 : suggestions.length - 1);
            }
        } else if (
            (event.key === 'Enter' || event.key === 'Tab') &&
            activeItem &&
            // Nothing to pick if the value is already there: let Enter submit and Tab move focus
            activeItem.value !== value
        ) {
            // Do not submit the form or move focus: the user is choosing a suggestion
            event.preventDefault();
            handleSelect(activeItem);
        }
    };

    React.useEffect(() => {
        if (activeItem) {
            document.getElementById(getItemId(activeIndex))?.scrollIntoView?.({block: 'nearest'});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex, activeItem]);

    return (
        <span ref={setAnchor} className={b(null, className)}>
            <TextInput
                {...inputProps}
                value={value}
                onUpdate={handleUpdate}
                onFocus={(event) => {
                    setFocused(true);
                    setRequested(openOnFocus);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setFocused(false);
                    setActiveIndex(0);
                    onBlur?.(event);
                }}
                onKeyDown={handleKeyDown}
                autoComplete={false}
                controlProps={{
                    ...controlProps,
                    role: 'combobox',
                    'aria-autocomplete': 'list',
                    'aria-expanded': open,
                    'aria-controls': open ? listId : undefined,
                    'aria-activedescendant': activeItem ? getItemId(activeIndex) : undefined,
                }}
            />
            <Popup
                open={open}
                anchorElement={anchor}
                placement={['bottom-start', 'top-start']}
                returnFocus={false}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setRequested(false);
                        setActiveIndex(0);
                    }
                }}
            >
                <div
                    id={listId}
                    role="listbox"
                    className={b('list', popupClassName)}
                    style={{width: anchor?.offsetWidth}}
                >
                    {suggestions.map((item, index) => (
                        <div
                            key={item.value}
                            id={getItemId(index)}
                            role="option"
                            aria-selected={index === activeIndex}
                            className={b('item', {active: index === activeIndex})}
                            // Keep focus in the input
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => handleSelect(item)}
                        >
                            {item.content ?? item.value}
                        </div>
                    ))}
                </div>
            </Popup>
        </span>
    );
}
