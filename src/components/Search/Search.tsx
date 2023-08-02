import {useRef, useEffect, useState} from 'react';
import cn from 'bem-cn-lite';

import {TextInput} from '@gravity-ui/uikit';

import './Search.scss';

const b = cn('ydb-search');

interface SearchProps {
    onChange: (value: string) => void;
    value?: string;
    className?: string;
    debounce?: number;
    placeholder?: string;
}

export const Search = ({
    onChange,
    value = '',
    className,
    debounce = 200,
    placeholder,
}: SearchProps) => {
    const [searchValue, setSearchValue] = useState<string>(value);

    const timer = useRef<number>();

    useEffect(() => {
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
            className={b(null, className)}
            placeholder={placeholder}
            value={searchValue}
            onUpdate={onSearchValueChange}
        />
    );
};
