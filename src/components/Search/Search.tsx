import React from 'react';

import type {TextInputProps} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {DebouncedInput} from '../DebouncedInput/DebouncedTextInput';

import './Search.scss';

const b = cn('ydb-search');

interface SearchProps extends Omit<TextInputProps, 'onUpdate' | 'onChange'> {
    onChange: (value: string) => void;
    value?: string;
    width?: React.CSSProperties['width'];
    debounce?: number;
    inputRef?: React.RefObject<HTMLInputElement>;
}

export const Search = ({
    onChange,
    value = '',
    width,
    className,
    debounce,
    inputRef,
    ...props
}: SearchProps) => {
    return (
        <DebouncedInput
            debounce={debounce}
            hasClear
            autoFocus
            controlRef={inputRef}
            style={{width}}
            className={b(null, className)}
            value={value}
            onUpdate={onChange}
            {...props}
        />
    );
};
