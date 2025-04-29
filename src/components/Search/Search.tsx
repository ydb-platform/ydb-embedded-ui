import React from 'react';

import {TextInput} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

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
    debounce = 200,
    placeholder,
    inputRef,
}: SearchProps) => {
    const [searchValue, setSearchValue] = React.useState<string>(value);

    const timer = React.useRef<number>();

    React.useEffect(() => {
        setSearchValue((prevValue) => {
            if (prevValue !== value) {
                return value;
            }

            return prevValue;
        });
    }, [value]);

    const onSearchValueChange = (newValue: string) => {
        setSearchValue(newValue);

        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            onChange?.(newValue);
        }, debounce);
    };

    return (
        <TextInput
            hasClear
            autoFocus
            controlRef={inputRef}
            style={{width}}
            className={b(null, className)}
            placeholder={placeholder}
            value={searchValue}
            onUpdate={onSearchValueChange}
        />
    );
};
