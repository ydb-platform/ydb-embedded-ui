import React from 'react';

import type {TextInputProps} from '@gravity-ui/uikit';
import {TextInput} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {DebouncedTextInput} from '../DebouncedInput/DebouncedTextInput';
import {useTableSearch} from '../TableKeyboardNavigation/TableKeyboardNavigation';

import {SearchContext} from './SearchProvider';

import './Search.scss';

const b = cn('ydb-search');

interface SearchProps extends Omit<TextInputProps, 'onUpdate' | 'onChange'> {
    onChange: (value: string) => void;
    value?: string;
    width?: React.CSSProperties['width'];
    debounce?: number;
    inputRef?: React.RefObject<HTMLInputElement>;
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
    const sharedSearch = React.useContext(SearchContext);
    const draft = tableFilter && debounce === undefined ? sharedSearch : undefined;
    const ownRef = React.useRef<HTMLInputElement>(null);
    const controlRef = inputRef ?? ownRef;
    useTableSearch(controlRef, tableFilter, value);

    const onUpdate = React.useCallback(
        (newValue: string) => {
            onChange(newValue);
        },
        [onChange],
    );

    const Input = draft || debounce === 0 ? TextInput : DebouncedTextInput;

    return (
        <Input
            {...(draft || debounce === 0 ? {} : {debounce})}
            hasClear
            autoFocus
            controlRef={controlRef}
            style={{width}}
            className={b(null, className)}
            value={draft?.[0] ?? value}
            onUpdate={draft?.[1] ?? onUpdate}
            {...props}
        />
    );
};
