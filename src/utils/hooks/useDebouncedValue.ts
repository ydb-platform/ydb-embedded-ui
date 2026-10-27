import React from 'react';

export function useDebouncedValue<T extends string | number | null>({
    value,
    onUpdate,
    debounce = 200,
    isEqual,
    resetKey,
}: {
    value: T;
    onUpdate?: (value: T) => void;
    debounce?: number;
    /** Compare a submitted value with the value returned by the parent. */
    isEqual?: (submitted: T, received: T) => boolean;
    /** Discard pending input when its owner changes context. */
    resetKey?: unknown;
}) {
    const [currentValue, setCurrentValue] = React.useState<T>(value);

    const timer = React.useRef<number>();
    const submittedUpdate = React.useRef<{value: T; isEqual?: typeof isEqual}>();
    const previousResetKey = React.useRef(resetKey);

    React.useEffect(() => {
        const submitted = submittedUpdate.current;
        const isAcknowledgement =
            previousResetKey.current === resetKey &&
            submitted !== undefined &&
            (submitted.isEqual?.(submitted.value, value) ?? submitted.value === value);
        previousResetKey.current = resetKey;
        submittedUpdate.current = undefined;

        // Preserve a newer pending edit when the parent acknowledges an earlier one.
        if (isAcknowledgement && timer.current !== undefined) {
            return;
        }

        window.clearTimeout(timer.current);
        timer.current = undefined;

        setCurrentValue((prevValue) => {
            if (prevValue !== value) {
                return value;
            }

            return prevValue;
        });
    }, [value, resetKey]);

    React.useEffect(() => () => window.clearTimeout(timer.current), []);

    const handleUpdate = (newValue: T) => {
        setCurrentValue(newValue);

        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            timer.current = undefined;
            submittedUpdate.current = {value: newValue, isEqual};
            onUpdate?.(newValue);
        }, debounce);
    };
    return [currentValue, handleUpdate] as const;
}
