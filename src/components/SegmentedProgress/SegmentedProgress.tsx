import {Flex, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './SegmentedProgress.scss';

const b = cn('ydb-segmented-progress');

export interface SegmentedProgressProps {
    value: number;
    total: number;
    className?: string;
    labelStart?: string;
}

export function SegmentedProgress({value, total, className, labelStart}: SegmentedProgressProps) {
    const percentUsed = total > 0 ? (value / total) * 100 : 0;
    const normalizedUsed =
        percentUsed < 1 ? Math.round(percentUsed * 10) / 10 : Math.round(percentUsed);
    return (
        <Flex direction="column" gap={1}>
            <Flex
                gap={1}
                alignItems="center"
                wrap="nowrap"
                className={b(null, className)}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={normalizedUsed}
            >
                {normalizedUsed > 0 && (
                    <div
                        className={b('section', {used: true})}
                        style={{width: `${normalizedUsed}%`}}
                    />
                )}
                {100 - normalizedUsed > 0 && <div className={b('section')} style={{flexGrow: 1}} />}
            </Flex>
            <Flex width="100%">
                {labelStart && <Text color="secondary">{labelStart}</Text>}
                <Text color="secondary" className={b('label')}>
                    {normalizedUsed}%
                </Text>
            </Flex>
        </Flex>
    );
}
