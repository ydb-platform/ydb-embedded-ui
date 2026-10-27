import React from 'react';

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

        // Preserve a newer pending edit when the parent acknowledges an earlier one.
        if (isAcknowledgement && timer.current !== undefined) {
            return;
        }

        setCurrentValue((prevValue) => {
            if (prevValue !== value) {
                return value;
            }

            return prevValue;
        });
    }, [value]);

    const handleUpdate = (newValue: T) => {
        setCurrentValue(newValue);

        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            timer.current = undefined;
            submittedValue.current = {value: newValue};
            onUpdate?.(newValue);
        }, debounce);
    };
    return [currentValue, handleUpdate] as const;
}
