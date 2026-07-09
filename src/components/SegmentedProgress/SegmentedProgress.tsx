import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './SegmentedProgress.scss';

const b = cn('ydb-segmented-progress');

type DisplayNoLimit = 'empty' | 'filled';
type SegmentedProgressTheme = 'neutral' | 'success' | 'warning' | 'danger';
type NormalizePercent = (percent: number) => number;

interface SegmentedProgressBaseProps {
    className?: string;
    dataQa?: string;
    labelStart?: string;
    labelEnd?: string;
    ariaLabel?: string;
    hideLabels?: boolean;
    normalizePercent?: NormalizePercent;
    theme?: SegmentedProgressTheme;
}

interface SegmentedProgressByValueProps extends SegmentedProgressBaseProps {
    value: number;
    total: number;
    fillPercent?: never;
    displayNoLimit?: DisplayNoLimit;
}

interface SegmentedProgressByFillPercentProps extends SegmentedProgressBaseProps {
    fillPercent: number;
    value?: never;
    total?: never;
    displayNoLimit?: never;
}

export type SegmentedProgressProps =
    | SegmentedProgressByValueProps
    | SegmentedProgressByFillPercentProps;

function clampPercent(percent: number) {
    if (!Number.isFinite(percent) || percent < 0) {
        return 0;
    }
    if (percent > 100) {
        return 100;
    }
    return percent;
}

function defaultNormalizePercent(percent: number) {
    const clampedPercent = clampPercent(percent);

    if (clampedPercent < 1) {
        return Math.round(clampedPercent * 10) / 10;
    }
    return Math.round(clampedPercent);
}

function isFillPercentMode(
    props: SegmentedProgressProps,
): props is SegmentedProgressByFillPercentProps {
    return 'fillPercent' in props;
}

function getPercentUsed(props: SegmentedProgressProps) {
    if (isFillPercentMode(props)) {
        return props.fillPercent;
    }

    if (props.total > 0) {
        return (props.value / props.total) * 100;
    }

    return 0;
}

function getFillWidth(props: SegmentedProgressProps, normalizedUsed: number) {
    if (isFillPercentMode(props)) {
        return normalizedUsed;
    }

    if (props.total) {
        return normalizedUsed;
    }

    if (props.displayNoLimit === 'filled') {
        return 100;
    }

    return 0;
}

export function SegmentedProgress(props: SegmentedProgressProps) {
    const {
        className,
        dataQa,
        labelStart,
        labelEnd,
        ariaLabel,
        hideLabels,
        normalizePercent = defaultNormalizePercent,
        theme,
    } = props;

    const percentUsed = getPercentUsed(props);
    const normalizedUsed = React.useMemo(
        () => clampPercent(normalizePercent(percentUsed)),
        [normalizePercent, percentUsed],
    );
    const fillWidth = getFillWidth(props, normalizedUsed);

    return (
        <Flex direction="column" gap={1}>
            <div
                className={b({theme}, className)}
                data-qa={dataQa}
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
            </div>
            {!hideLabels && (
                <Flex width="100%">
                    {labelStart && <Text color="secondary">{labelStart}</Text>}
                    <Text color="secondary" className={b('label')}>
                        {labelEnd ?? `${normalizedUsed}%`}
                    </Text>
                </Flex>
            )}
        </Flex>
    );
}
