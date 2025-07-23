import React from 'react';

import type {HelpMarkProps, TextProps} from '@gravity-ui/uikit';
import {Flex, HelpMark, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {ProgressStatus} from '../../utils/progress';

import {SvgCircle} from './SvgCircle';
import {
    ROTATION_OFFSET,
    SIZE_CONFIG,
    calculateCircumference,
    calculateOverlapDasharray,
    calculateStrokeDasharray,
} from './utils';

import './DoughnutMetrics.scss';

const b = cn('ydb-doughnut-metrics');

type Size = keyof typeof SIZE_CONFIG;

const SizeContext = React.createContext<Size>('medium');

// Legend component
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
    noteIconSize = 'm',
}: LegendProps) {
    return (
        <Flex gap={1} alignItems="center">
            <Text variant={variant} color={color} className={b('legend')} as="div">
                {children}
            </Text>
            {note && (
                <HelpMark
                    iconSize={noteIconSize}
                    className={b('legend-note')}
                    popoverProps={{placement: 'right'}}
                >
                    {note}
                </HelpMark>
            )}
        </Flex>
    );
}

// Value component
function Value({children, variant}: LegendProps) {
    const size = React.useContext(SizeContext);
    const finalVariant = variant || SIZE_CONFIG[size].textVariant;

    return (
        <Text variant={finalVariant} className={b('value')}>
            {children}
        </Text>
    );
}

// Main component
interface DoughnutProps {
    status: ProgressStatus;
    fillWidth: number;
    children?: React.ReactNode;
    className?: string;
    size?: Size;
}

export function DoughnutMetrics({
    status,
    fillWidth,
    children,
    className,
    size = 'medium',
}: DoughnutProps) {
    const config = SIZE_CONFIG[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = calculateCircumference(radius);
    const strokeDashoffset = circumference * ROTATION_OFFSET;

    const centerX = config.width / 2;
    const centerY = config.width / 2;

    const strokeDasharray = calculateStrokeDasharray(fillWidth, circumference);
    const overlapDasharray = calculateOverlapDasharray(fillWidth, circumference);
    const needsOverlapCircle = fillWidth > 100;

    return (
        <SizeContext.Provider value={size}>
            <div className={b({status}, className)}>
                <svg width={config.width} height={config.width} className={b('doughnut')}>
                    {/* Background circle */}
                    <SvgCircle
                        cx={centerX}
                        cy={centerY}
                        r={radius}
                        stroke="var(--doughnut-backdrop-color)"
                        strokeWidth={config.strokeWidth}
                    />

                    {/* Progress circle */}
                    <SvgCircle
                        cx={centerX}
                        cy={centerY}
                        r={radius}
                        stroke="var(--doughnut-color)"
                        strokeWidth={config.strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className={b('progress-circle')}
                    />

                    {/* Overlap circle for values > 100% */}
                    {needsOverlapCircle && (
                        <SvgCircle
                            cx={centerX}
                            cy={centerY}
                            r={radius}
                            stroke="var(--doughnut-overlap-color)"
                            strokeWidth={config.strokeWidth}
                            strokeDasharray={overlapDasharray}
                            strokeDashoffset={strokeDashoffset}
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
