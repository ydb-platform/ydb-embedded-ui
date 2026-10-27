import React from 'react';

import {useEventHandler} from './useEventHandler';

export function useDebouncedValue<T extends string | number | null>({
    value,
    onUpdate,
    debounce = 200,
}: {
    value: T;
    onUpdate?: (value: T) => void;
    debounce?: number;
}) {
    const [currentValue, setCurrentValue] = React.useState<T>(value);

    const timer = React.useRef<number>();
    const submittedValue = React.useRef<{value: T}>();

    React.useEffect(() => {
        const isAcknowledgement = submittedValue.current?.value === value;
        submittedValue.current = undefined;

        // The parent can acknowledge an older edit after the user has already typed more.
        if (isAcknowledgement) {
            return;
        }

        window.clearTimeout(timer.current);
        setCurrentValue(value);
    }, [value]);

    React.useEffect(() => () => window.clearTimeout(timer.current), []);

    const submit = useEventHandler((newValue: T) => {
        // An unchanged prop will not trigger the synchronization effect.
        submittedValue.current = newValue === value ? undefined : {value: newValue};
        onUpdate?.(newValue);
    });

    const handleUpdate = (newValue: T) => {
        setCurrentValue(newValue);

        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            submit(newValue);
        }, debounce);
    };
    return [currentValue, handleUpdate] as const;
}
