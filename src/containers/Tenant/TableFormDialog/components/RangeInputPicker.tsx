import React from 'react';

import {Slider, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';

import './RangeInputPicker.scss';

const b = cn('ydb-range-input-picker');

interface RangeInputPickerProps {
    value?: number;
    min: number;
    max: number;
    step?: number;
    marks?: number[];
    markFormat?: (value: number) => string;
    onUpdate: (value: number) => void;
    acceptInputValue?: (value: string) => boolean;
    parseInputValue?: (value: string) => number | undefined;
    formatInputValue?: (value: number) => string;
    disabled?: boolean;
    endContent?: React.ReactNode;
    className?: string;
}

function clamp(value: number, min: number, max: number) {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

function defaultAcceptInputValue(value: string) {
    return /^\d*$/.test(value);
}

function defaultParseInputValue(value: string) {
    return Number.parseInt(value, 10);
}

function defaultFormatInputValue(value: number) {
    return String(value);
}

export function RangeInputPicker({
    value,
    min,
    max,
    step = 1,
    marks,
    markFormat,
    onUpdate,
    acceptInputValue = defaultAcceptInputValue,
    parseInputValue = defaultParseInputValue,
    formatInputValue = defaultFormatInputValue,
    disabled,
    endContent,
    className,
}: RangeInputPickerProps) {
    const hasNumericValue = typeof value === 'number' && Number.isFinite(value);
    const displayValue = hasNumericValue ? formatInputValue(value) : '';

    const [inputValue, setInputValue] = React.useState(displayValue);
    const [isInputFocused, setIsInputFocused] = React.useState(false);
    const [hasInputChanges, setHasInputChanges] = React.useState(false);

    React.useEffect(() => {
        if (!isInputFocused) {
            setInputValue(displayValue);
        }
    }, [displayValue, isInputFocused]);

    const sliderValue = React.useMemo(() => {
        if (!isInputFocused || !hasInputChanges) {
            return hasNumericValue ? clamp(value, min, max) : min;
        }

        const parsedDraft = parseInputValue(inputValue);
        if (typeof parsedDraft === 'number' && !Number.isNaN(parsedDraft)) {
            return clamp(parsedDraft, min, max);
        }
        return hasNumericValue ? clamp(value, min, max) : min;
    }, [
        hasInputChanges,
        hasNumericValue,
        inputValue,
        isInputFocused,
        max,
        min,
        parseInputValue,
        value,
    ]);

    const handleSliderUpdate = React.useCallback(
        (nextValue: number | number[]) => {
            const normalizedValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;

            setInputValue(formatInputValue(normalizedValue));
            onUpdate(normalizedValue);
        },
        [formatInputValue, onUpdate],
    );

    const handleInputUpdate = React.useCallback(
        (nextValue: string) => {
            if (!acceptInputValue(nextValue)) {
                return;
            }

            setInputValue(nextValue);
            setHasInputChanges(true);

            const parsedValue = parseInputValue(nextValue);
            if (
                typeof parsedValue === 'number' &&
                !Number.isNaN(parsedValue) &&
                parsedValue >= min &&
                parsedValue <= max
            ) {
                onUpdate(parsedValue);
            }
        },
        [acceptInputValue, max, min, onUpdate, parseInputValue],
    );

    const handleInputFocus = React.useCallback(() => {
        setIsInputFocused(true);
        setHasInputChanges(false);
    }, []);

    const handleInputBlur = React.useCallback(() => {
        if (!hasInputChanges) {
            setIsInputFocused(false);
            setInputValue(displayValue);
            return;
        }

        const fallbackValue = hasNumericValue ? clamp(value, min, max) : min;

        let normalizedValue: number;
        if (inputValue === '') {
            normalizedValue = fallbackValue;
        } else {
            const parsedValue = parseInputValue(inputValue);
            if (typeof parsedValue !== 'number' || Number.isNaN(parsedValue)) {
                normalizedValue = fallbackValue;
            } else {
                normalizedValue = clamp(parsedValue, min, max);
            }
        }

        setIsInputFocused(false);
        setInputValue(formatInputValue(normalizedValue));
        onUpdate(normalizedValue);
    }, [
        displayValue,
        formatInputValue,
        hasInputChanges,
        hasNumericValue,
        inputValue,
        max,
        min,
        onUpdate,
        parseInputValue,
        value,
    ]);

    return (
        <div className={b(null, className)}>
            <TextInput
                value={inputValue}
                onUpdate={handleInputUpdate}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                disabled={disabled}
                endContent={endContent}
                className={b('input')}
            />
            <Slider
                value={sliderValue}
                min={min}
                max={max}
                step={step}
                size="s"
                marks={marks}
                markFormat={markFormat}
                onUpdate={handleSliderUpdate}
                disabled={disabled}
                className={b('slider')}
            />
        </div>
    );
}
