import React from 'react';

import {Flex, Progress, Text} from '@gravity-ui/uikit';

import type {FormatProgressViewerValues} from '../../../../../components/ProgressViewer/ProgressViewer';
import {cn} from '../../../../../utils/cn';
import {isNumeric, safeParseNumber} from '../../../../../utils/utils';

import {DEFAULT_PROGRESS_WIDTH, MAX_PERCENTAGE, MIN_PERCENTAGE, PROGRESS_SIZES} from './constants';
import i18n from './i18n';

import './ProgressWrapper.scss';

interface ProgressWrapperProps {
    value?: number | string;
    capacity?: number | string;
    formatValues?: FormatProgressViewerValues;
    size?: 'storage';
    className?: string;
    width?: number;
}

const defaultFormatValues: FormatProgressViewerValues = (value, total) => {
    return [value, total];
};

const b = cn('progress-wrapper');

export function ProgressWrapper({
    value,
    capacity,
    formatValues = defaultFormatValues,
    size = 'storage',
    className,
    width = DEFAULT_PROGRESS_WIDTH,
}: ProgressWrapperProps) {
    // Input validation and error handling
    if (!isNumeric(value)) {
        return <div className={className}>{i18n('alert_no-data')}</div>;
    }

    const numericValue = safeParseNumber(value);
    const numericCapacity = safeParseNumber(capacity);

    // Handle edge cases: negative values, zero capacity
    if (numericValue < 0) {
        return <div className={className}>{i18n('alert_no-data')}</div>;
    }

    if (numericCapacity <= 0 && capacity !== undefined) {
        return <div className={className}>{i18n('alert_no-data')}</div>;
    }

    // Calculate percentage for uikit Progress with proper bounds checking
    const rawPercentage = Math.floor((numericValue / numericCapacity) * MAX_PERCENTAGE);
    const fillWidth = Math.max(MIN_PERCENTAGE, rawPercentage);
    const clampedFillWidth = Math.min(fillWidth, MAX_PERCENTAGE);

    // Get formatted display text - match original ProgressViewer exactly
    const [valueText, capacityText] = React.useMemo(() => {
        if (formatValues) {
            return formatValues(Number(value), Number(capacity));
        }
        return [value, capacity];
    }, [formatValues, value, capacity]);

    // For storage variant, we always use the Figma green color regardless of colorizeProgress
    // This matches the original ProgressViewer behavior for storage size

    // Memoize display text to avoid unnecessary recalculations
    const displayText = React.useMemo(() => {
        if (!isNumeric(numericCapacity) || numericCapacity <= 0) {
            return String(valueText);
        }
        return i18n('value_of_capacity', {value: valueText, capacity: capacityText});
    }, [valueText, capacityText, numericCapacity]);

    // Validate width prop
    const validatedWidth = Math.max(0, width);

    // For storage variant, use Flex layout similar to current ProgressViewer
    if (size === 'storage') {
        return (
            <Flex alignItems="center" gap="2" className={className}>
                <div className={b('storage-progress')} style={{width: `${validatedWidth}px`}}>
                    <Progress
                        value={clampedFillWidth}
                        theme="success"
                        size={PROGRESS_SIZES.STORAGE}
                    />
                </div>
                <Text variant="body-1" color="secondary">
                    {displayText}
                </Text>
            </Flex>
        );
    }

    // Default layout (though we're only using storage variant for now)
    return (
        <div className={className}>
            <Progress value={clampedFillWidth} text={displayText} size={PROGRESS_SIZES.DEFAULT} />
        </div>
    );
}
