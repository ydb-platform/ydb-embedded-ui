import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './SegmentedProgress.scss';

const b = cn('ydb-segmented-progress');

type DisplayNoLimit = 'empty' | 'filled';

export interface SegmentedProgressProps {
    value: number;
    total: number;
    className?: string;
    labelStart?: string;
    labelEnd?: string;
    ariaLabel?: string;
    displayNoLimit?: DisplayNoLimit;
}

export function SegmentedProgress({
    value,
    total,
    className,
    labelStart,
    labelEnd,
    ariaLabel,
    displayNoLimit = 'empty',
}: SegmentedProgressProps) {
    const percentUsed = total > 0 ? (value / total) * 100 : 0;
    const normalizedUsed = React.useMemo(() => {
        if (percentUsed < 0) {
            return 0;
        }
        if (percentUsed > 100) {
            return 100;
        }
        if (percentUsed < 1) {
            return Math.round(percentUsed * 10) / 10;
        }
        return Math.round(percentUsed);
    }, [percentUsed]);

    const fillWidth = React.useMemo(() => {
        if (!total) {
            if (displayNoLimit === 'filled') {
                return 100;
            }
            return 0;
        }
        return normalizedUsed;
    }, [total, normalizedUsed, displayNoLimit]);

    return (
        <Flex direction="column" gap={1}>
            <Flex
                gap={1}
                alignItems="center"
                wrap="nowrap"
                className={b(null, className)}
                role="progressbar"
                aria-label={ariaLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={normalizedUsed}
            >
                {fillWidth > 0 && (
                    <div className={b('section', {used: true})} style={{width: `${fillWidth}%`}} />
                )}
                {100 - fillWidth > 0 && <div className={b('section')} style={{flexGrow: 1}} />}
            </Flex>
            <Flex width="100%">
                {labelStart && <Text color="secondary">{labelStart}</Text>}
                <Text color="secondary" className={b('label')}>
                    {labelEnd ?? `${normalizedUsed}%`}
                </Text>
            </Flex>
        </Flex>
    );
}
