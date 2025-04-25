import React from 'react';

import {cn} from '../../utils/cn';
import {DebouncedInput} from '../DebouncedInput/DebouncedTextInput';

import './Search.scss';

const b = cn('ydb-search');

interface SearchProps {
    onChange: (value: string) => void;
    value?: string;
    width?: React.CSSProperties['width'];
    className?: string;
    debounce?: number;
    placeholder?: string;
    inputRef?: React.RefObject<HTMLInputElement>;
}

export const Search = ({
    onChange,
    value = '',
    width,
    className,
    debounce,
    placeholder,
    inputRef,
}: SearchProps) => {
    return (
        <DebouncedInput
            debounce={debounce}
            hasClear
            autoFocus
            controlRef={inputRef}
            style={{width}}
            className={b(null, className)}
            placeholder={placeholder}
            value={value}
            onUpdate={onChange}
        />
    );
};
