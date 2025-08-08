import React from 'react';

import {Progress} from '@gravity-ui/uikit';

import {defaultFormatProgressValues} from '../../utils/progress';
import {safeParseNumber} from '../../utils/utils';

import {ProgressContainer} from './ProgressContainer';
import i18n from './i18n';
import {
    PROGRESS_SIZE,
    calculateProgressWidth,
    formatDisplayValues,
    formatProgressText,
    isValidValue,
} from './progressUtils';
import type {ProgressWrapperSingleProps} from './types';

export function SingleProgress({
    value,
    capacity,
    formatValues = defaultFormatProgressValues,
    className,
    width,
    size = PROGRESS_SIZE,
    withCapacityUsage = false,
}: ProgressWrapperSingleProps) {
    if (!isValidValue(value)) {
        return <div className={className}>{i18n('alert_no-data')}</div>;
    }

    const numericValue = safeParseNumber(value);
    const numericCapacity = safeParseNumber(capacity);
    const clampedFillWidth = calculateProgressWidth(numericValue, numericCapacity);

    const [valueText, capacityText] = React.useMemo(() => {
        return formatDisplayValues(value, capacity, formatValues);
    }, [formatValues, value, capacity]);

    const displayText = React.useMemo(() => {
        return formatProgressText(valueText, capacityText, numericCapacity);
    }, [valueText, capacityText, numericCapacity]);

    return (
        <ProgressContainer
            displayText={displayText}
            withCapacityUsage={withCapacityUsage}
            className={className}
            width={width}
        >
            <Progress value={clampedFillWidth} theme="success" size={size} />
        </ProgressContainer>
    );
}
