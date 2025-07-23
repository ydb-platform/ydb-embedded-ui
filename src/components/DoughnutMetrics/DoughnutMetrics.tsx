import React from 'react';

import type {HelpMarkProps, TextProps} from '@gravity-ui/uikit';
import {Flex, HelpMark, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {ProgressStatus} from '../../utils/progress';

import './DoughnutMetrics.scss';

const b = cn('ydb-doughnut-metrics');

const SizeContext = React.createContext<'small' | 'medium' | 'large'>('medium');

interface LegendProps {
    children?: React.ReactNode;
    variant?: TextProps['variant'];
    color?: TextProps['color'];
    note?: React.ReactNode;
    noteIconSize?: HelpMarkProps['iconSize'];
}

function Legend({
    children,
    variant = 'subheader-3',
    color = 'primary',
    note,
    noteIconSize,
}: LegendProps) {
    return (
        <Flex gap={1} alignItems="center">
            <Text variant={variant} color={color} className={b('legend')} as="div">
                {children}
            </Text>
            {note && (
                <HelpMark
                    iconSize={noteIconSize || 'm'}
                    className={b('legend-note')}
                    popoverProps={{placement: 'right'}}
                >
                    {note}
                </HelpMark>
            )}
        </Flex>
    );
}
function Value({children, variant}: LegendProps) {
    const size = React.useContext(SizeContext);

    const sizeVariantMap = {
        small: 'subheader-1',
        medium: 'subheader-2',
        large: 'subheader-3',
    } as const;

    const finalVariant = variant || sizeVariantMap[size];

    return (
        <Text variant={finalVariant} className={b('value')}>
            {children}
        </Text>
    );
}

interface DoughnutProps {
    status: ProgressStatus;
    fillWidth: number;
    children?: React.ReactNode;
    className?: string;
    size?: 'small' | 'medium' | 'large';
}

export function DoughnutMetrics({
    status,
    fillWidth,
    children,
    className,
    size = 'medium',
}: DoughnutProps) {
    // Size configurations
    const sizeConfig = {
        small: {width: 65, strokeWidth: 12},
        medium: {width: 100, strokeWidth: 16},
        large: {width: 130, strokeWidth: 20},
    };

    const config = sizeConfig[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate stroke dash for filled portion
    let strokeDasharray: string;
    // Start from bottom (270 degrees = 0.75 of circumference)
    const strokeDashoffset = circumference * 0.75;

    if (fillWidth <= 100) {
        const filledLength = (fillWidth / 100) * circumference;
        // Use negative dash to go counter-clockwise
        strokeDasharray = `0 ${circumference - filledLength} ${filledLength} 0`;
    } else {
        // For values over 100%, we need to show overlap
        strokeDasharray = `0 0 ${circumference} 0`;
        // We'll use a second circle for the overlap
    }

    const needsOverlapCircle = fillWidth > 100;
    const overlapDasharray = needsOverlapCircle
        ? `0 ${circumference - ((fillWidth - 100) / 100) * circumference} ${((fillWidth - 100) / 100) * circumference} 0`
        : '0 0';

    return (
        <SizeContext.Provider value={size}>
            <div className={b({status}, className)} style={{position: 'relative'}}>
                <svg width={config.width} height={config.width} className={b('doughnut', {size})}>
                    {/* Background circle */}
                    <circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={radius}
                        fill="none"
                        stroke="var(--doughnut-backdrop-color)"
                        strokeWidth={config.strokeWidth}
                    />

                    {/* Progress circle */}
                    <circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={radius}
                        fill="none"
                        stroke="var(--doughnut-color)"
                        strokeWidth={config.strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="butt"
                        className={b('progress-circle')}
                    />

                    {/* Overlap circle for values > 100% */}
                    {needsOverlapCircle && (
                        <circle
                            cx={config.width / 2}
                            cy={config.width / 2}
                            r={radius}
                            fill="none"
                            stroke="var(--doughnut-overlap-color)"
                            strokeWidth={config.strokeWidth}
                            strokeDasharray={overlapDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="butt"
                            className={b('overlap-circle')}
                        />
                    )}
                </svg>
                <div className={b('text-wrapper')}>{children}</div>
            </div>
        </SizeContext.Provider>
    );
}

DoughnutMetrics.Legend = Legend;
DoughnutMetrics.Value = Value;
