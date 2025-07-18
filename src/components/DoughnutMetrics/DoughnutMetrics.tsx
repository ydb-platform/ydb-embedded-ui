import React from 'react';

import type {TextProps} from '@gravity-ui/uikit';
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
}

function Legend({children, variant = 'subheader-3', color = 'primary', note}: LegendProps) {
    return (
        <Flex gap={1} alignItems="center">
            <Text variant={variant} color={color} className={b('legend')} as="div">
                {children}
            </Text>
            {note && (
                <HelpMark className={b('legend-note')} popoverProps={{placement: 'right'}}>
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
    let filledDegrees = fillWidth * 3.6;
    let doughnutFillVar = 'var(--doughnut-color)';
    let doughnutBackdropVar = 'var(--doughnut-backdrop-color)';

    if (filledDegrees > 360) {
        filledDegrees -= 360;
        doughnutBackdropVar = 'var(--doughnut-color)';
        doughnutFillVar = 'var(--doughnut-overlap-color)';
    }

    const doughnutStyle: React.CSSProperties = {
        background: `conic-gradient(${doughnutFillVar} 0deg ${filledDegrees}deg, ${doughnutBackdropVar} ${filledDegrees}deg 360deg)`,
    };

    return (
        <SizeContext.Provider value={size}>
            <div className={b(null, className)} style={{position: 'relative'}}>
                <div style={doughnutStyle} className={b('doughnut', {status, size})}></div>
                <div className={b('text-wrapper')}>{children}</div>
            </div>
        </SizeContext.Provider>
    );
}

DoughnutMetrics.Legend = Legend;
DoughnutMetrics.Value = Value;
