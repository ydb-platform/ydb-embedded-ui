import {useEffect, useRef, useState} from 'react';

import {TextInput} from '@gravity-ui/uikit';

interface StorageFilterProps {
    className?: string;
    value?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
    debounce?: number;
}

export const StorageFilter = (props: StorageFilterProps) => {
    const {
        className,
        value = '',
        placeholder,
        onChange,
        debounce = 200,
    } = props;
    const [filterValue, setFilterValue] = useState(value);
    const timer = useRef<number>();

    useEffect(() => {
        setFilterValue((prevValue) => {
            if (prevValue !== value) {
                return value;
            }

            return prevValue;
        });
    }, [value]);

    const changeFilter = (newValue: string) => {
        setFilterValue(newValue);

        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            onChange?.(newValue);
        }, debounce);
    };

    return (
        <TextInput
            className={className}
            placeholder={placeholder}
            value={filterValue}
            onUpdate={changeFilter}
            hasClear
            autoFocus
        />
    );
}
