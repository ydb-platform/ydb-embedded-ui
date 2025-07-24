import React from 'react';

import {Flex, Progress, Text} from '@gravity-ui/uikit';
import type {ProgressSize, ProgressTheme} from '@gravity-ui/uikit';

import type {MemorySegment} from '../../../../../components/MemoryViewer/utils';
import {getMemorySegmentColor} from '../../../../../components/MemoryViewer/utils';
import {defaultFormatProgressValues} from '../../../../../utils/progress';
import type {FormatProgressViewerValues} from '../../../../../utils/progress';
import {isNumeric, safeParseNumber} from '../../../../../utils/utils';

import {DEFAULT_PROGRESS_WIDTH, MAX_PERCENTAGE, MIN_PERCENTAGE, PROGRESS_SIZE} from './constants';
import i18n from './i18n';

interface ProgressWrapperBaseProps {
    formatValues?: FormatProgressViewerValues;
    className?: string;
    width?: number | 'full';
    size?: ProgressSize;
    withValue?: boolean;
}

interface ProgressWrapperSingleProps extends ProgressWrapperBaseProps {
    value?: number | string;
    capacity?: number | string;
    stack?: never;
}

interface ProgressWrapperStackProps extends ProgressWrapperBaseProps {
    stack: MemorySegment[];
    totalCapacity?: number | string;
    value?: never;
    capacity?: never;
}

type ProgressWrapperProps = ProgressWrapperSingleProps | ProgressWrapperStackProps;

const isValidValue = (val?: number | string): boolean =>
    isNumeric(val) && safeParseNumber(val) >= 0;

// Map memory segment types to Progress themes
const getProgressThemeForSegment = (segmentKey: string): ProgressTheme => {
    switch (segmentKey) {
        case 'SharedCacheConsumption':
            return 'info';
        case 'QueryExecutionConsumption':
            return 'success';
        case 'MemTableConsumption':
            return 'warning';
        case 'AllocatorCachesMemory':
            return 'misc';
        default:
            return 'default';
    }
};

export function ProgressWrapper({
    formatValues = defaultFormatProgressValues,
    className,
    width = DEFAULT_PROGRESS_WIDTH,
    size = PROGRESS_SIZE,
    withValue = false,
    ...props
}: ProgressWrapperProps) {
    const isFullWidth = width === 'full';
    const validatedWidth = isFullWidth ? 0 : Math.max(0, width || DEFAULT_PROGRESS_WIDTH);

    // Handle stack mode
    if ('stack' in props && props.stack) {
        const {stack, totalCapacity} = props;
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
            theme: getProgressThemeForSegment(segment.key),
        }));

        const [totalValueText, totalCapacityText] = React.useMemo(() => {
            if (formatValues) {
                return formatValues(totalValue, numericTotalCapacity || totalValue);
            }
            return [totalValue, numericTotalCapacity || totalValue];
        }, [formatValues, totalValue, numericTotalCapacity]);

        const displayText = React.useMemo(() => {
            if (numericTotalCapacity && numericTotalCapacity > 0) {
                return i18n('context_capacity-usage', {
                    value: totalValueText,
                    capacity: totalCapacityText,
                });
            }
            return String(totalValueText);
        }, [totalValueText, totalCapacityText, numericTotalCapacity]);

        return (
            <Flex alignItems="center" gap="2" className={className}>
                <div
                    style={{
                        width: isFullWidth ? '100%' : `${validatedWidth}px`,
                        flex: isFullWidth ? '1' : 'none',
                    }}
                >
                    <Progress value={MAX_PERCENTAGE} stack={stackElements} size={size} />
                </div>
                {withValue && (
                    <Text variant="body-1" color="secondary">
                        {displayText}
                    </Text>
                )}
            </Flex>
        );
    }

    // Handle single value mode (existing logic)
    const {value, capacity} = props as ProgressWrapperSingleProps;

    if (!isValidValue(value)) {
        return <div className={className}>{i18n('alert_no-data')}</div>;
    }

    const numericValue = safeParseNumber(value);
    const numericCapacity = safeParseNumber(capacity);

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
        return i18n('context_capacity-usage', {value: valueText, capacity: capacityText});
    }, [valueText, capacityText, numericCapacity]);

    return (
        <Flex alignItems="center" gap="2" className={className}>
            <div
                style={{
                    width: isFullWidth ? '100%' : `${validatedWidth}px`,
                    flex: isFullWidth ? '1' : 'none',
                }}
            >
                <Progress value={clampedFillWidth} theme="success" size={size} />
            </div>
            {withValue && (
                <Text variant="body-1" color="secondary">
                    {displayText}
                </Text>
            )}
        </Flex>
    );
}
