import React from 'react';

import {cn} from '../../utils/cn';
import {DebouncedInput} from '../DebouncedInput/DebouncedInput';

import './Search.scss';

const b = cn('ydb-search');

interface SearchProps {
    onChange: (value: string) => void;
    value?: string;
    width?: React.CSSProperties['width'];
    className?: string;
    debounce?: number;
    placeholder?: string;
}

export const Search = ({
    onChange,
    value = '',
    width,
    className,
    debounce,
    placeholder,
}: SearchProps) => {
    return (
        <DebouncedInput
            debounce={debounce}
            hasClear
            autoFocus
            style={{width}}
            className={b(null, className)}
            placeholder={placeholder}
            value={value}
            onUpdate={onChange}
        />
    );
};
