import React from 'react';

import type {TextInputProps} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {DebouncedTextInput} from '../DebouncedInput/DebouncedTextInput';
import {useTableSearch} from '../TableKeyboardNavigation/TableKeyboardNavigation';

import './Search.scss';

const b = cn('ydb-search');

interface SearchProps extends Omit<TextInputProps, 'onUpdate' | 'onChange'> {
    onChange: (value: string) => void;
    value?: string;
    width?: React.CSSProperties['width'];
    debounce?: number;
    inputRef?: React.RefObject<HTMLInputElement>;
    /** Registers this input as the global filter for the surrounding table layout. */
    tableFilter?: boolean;
}

export const Search = ({
    onChange,
    value = '',
    width,
    className,
    debounce,
    inputRef,
    tableFilter = false,
    ...props
}: SearchProps) => {
    const ownRef = React.useRef<HTMLInputElement>(null);
    const controlRef = inputRef ?? ownRef;
    useTableSearch(controlRef, tableFilter, value);

    const onUpdate = React.useCallback(
        (newValue: string) => {
            onChange(newValue);
        },
        [onChange],
    );

    return (
        <DebouncedTextInput
            debounce={debounce}
            hasClear
            autoFocus
            controlRef={controlRef}
            style={{width}}
            className={b(null, className)}
            value={value}
            onUpdate={onUpdate}
            {...props}
        />
    );
};
