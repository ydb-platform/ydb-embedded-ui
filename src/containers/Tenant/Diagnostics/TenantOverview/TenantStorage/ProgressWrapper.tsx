import React from 'react';

import {Flex, Progress, Text} from '@gravity-ui/uikit';

import type {FormatProgressViewerValues} from '../../../../../components/ProgressViewer/ProgressViewer';
import {isNumeric, safeParseNumber} from '../../../../../utils/utils';

import {DEFAULT_PROGRESS_WIDTH, MAX_PERCENTAGE, MIN_PERCENTAGE, PROGRESS_SIZE} from './constants';
import i18n from './i18n';

interface ProgressWrapperProps {
    value?: number | string;
    capacity?: number | string;
    formatValues?: FormatProgressViewerValues;
    className?: string;
    width?: number;
}

const defaultFormatValues: FormatProgressViewerValues = (value, total) => {
    return [value, total];
};

export function ProgressWrapper({
    value,
    capacity,
    formatValues = defaultFormatValues,
    className,
    width = DEFAULT_PROGRESS_WIDTH,
}: ProgressWrapperProps) {
    if (!isNumeric(value)) {
        return <div className={className}>{i18n('alert_no-data')}</div>;
    }

    const numericValue = safeParseNumber(value);
    const numericCapacity = safeParseNumber(capacity);

    if (numericValue < 0) {
        return <div className={className}>{i18n('alert_no-data')}</div>;
    }

    const rawPercentage =
        numericCapacity > 0
            ? Math.floor((numericValue / numericCapacity) * MAX_PERCENTAGE)
            : MAX_PERCENTAGE;
    const fillWidth = Math.max(MIN_PERCENTAGE, rawPercentage);
    const clampedFillWidth = Math.min(fillWidth, MAX_PERCENTAGE);

    const [valueText, capacityText] = React.useMemo(() => {
        if (formatValues) {
            return formatValues(Number(value), Number(capacity));
        }
        return [value, capacity];
    }, [formatValues, value, capacity]);

    const displayText = React.useMemo(() => {
        if (numericCapacity <= 0) {
            return String(valueText);
        }
        return i18n('value_of_capacity', {value: valueText, capacity: capacityText});
    }, [valueText, capacityText, numericCapacity]);

    const validatedWidth = Math.max(0, width);

    return (
        <Flex alignItems="center" gap="2" className={className}>
            <div style={{width: `${validatedWidth}px`}}>
                <Progress value={clampedFillWidth} theme="success" size={PROGRESS_SIZE} />
            </div>
            <Text variant="body-1" color="secondary">
                {displayText}
            </Text>
        </Flex>
    );
}
