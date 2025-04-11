import React from 'react';

import type {TextInputProps} from '@gravity-ui/uikit';
import {TextInput} from '@gravity-ui/uikit';

interface SearchProps extends TextInputProps {
    debounce?: number;
}

export const DebouncedInput = ({onUpdate, value = '', debounce = 200, ...rest}: SearchProps) => {
    const [currentValue, setCurrentValue] = React.useState<string>(value);

    const timer = React.useRef<number>();

    React.useEffect(() => {
        setCurrentValue((prevValue) => {
            if (prevValue !== value) {
                return value;
            }

            return prevValue;
        });
    }, [value]);

    const onSearchValueChange = (newValue: string) => {
        setCurrentValue(newValue);

        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            onUpdate?.(newValue);
        }, debounce);
    };

    return <TextInput value={currentValue} onUpdate={onSearchValueChange} {...rest} />;
};
