import React from 'react';

import {Progress} from '@gravity-ui/uikit';

import {defaultFormatProgressValues} from '../../utils/progress';
import {safeParseNumber} from '../../utils/utils';
import {getMemorySegmentColor} from '../MemoryViewer/utils';

import {ProgressContainer} from './ProgressContainer';
import i18n from './i18n';
import {
    MAX_PERCENTAGE,
    PROGRESS_SIZE,
    formatDisplayValues,
    formatProgressText,
} from './progressUtils';
import type {ProgressWrapperStackProps} from './types';

export function StackProgress({
    stack,
    totalCapacity,
    formatValues = defaultFormatProgressValues,
    className,
    width,
    size = PROGRESS_SIZE,
    withValue = false,
}: ProgressWrapperStackProps) {
    const displaySegments = stack.filter((segment) => !segment.isInfo && segment.value > 0);

    if (displaySegments.length === 0) {
        return <div className={className}>{i18n('alert_no-data')}</div>;
    }

    const totalValue = displaySegments.reduce((sum, segment) => sum + segment.value, 0);
    const numericTotalCapacity = safeParseNumber(totalCapacity);
    const maxValue = numericTotalCapacity || totalValue;

    const stackElements = displaySegments.map((segment) => ({
        value: maxValue > 0 ? (segment.value / maxValue) * MAX_PERCENTAGE : 0,
        color: getMemorySegmentColor(segment.key),
        title: segment.label,
    }));

    const [totalValueText, totalCapacityText] = React.useMemo(() => {
        return formatDisplayValues(totalValue, numericTotalCapacity || totalValue, formatValues);
    }, [formatValues, totalValue, numericTotalCapacity]);

    const displayText = React.useMemo(() => {
        return formatProgressText(totalValueText, totalCapacityText, numericTotalCapacity || 0);
    }, [totalValueText, totalCapacityText, numericTotalCapacity]);

    return (
        <ProgressContainer
            displayText={displayText}
            withValue={withValue}
            className={className}
            width={width}
        >
            <Progress value={MAX_PERCENTAGE} stack={stackElements} size={size} />
        </ProgressContainer>
    );
}
