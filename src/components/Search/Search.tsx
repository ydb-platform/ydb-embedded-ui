import {useRef, useEffect, useState} from 'react';

import {TextInput} from '@gravity-ui/uikit';

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
            className={className}
            placeholder={placeholder}
            value={searchValue}
            onUpdate={onSearchValueChange}
        />
    );
};
