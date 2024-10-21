import React from 'react';

import type {TextProps} from '@gravity-ui/uikit';
import {Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {ProgressStatus} from '../../utils/progress';

import './DoughnutMetrics.scss';

const b = cn('ydb-doughnut-metrics');

interface LegendProps {
    children?: React.ReactNode;
    variant?: TextProps['variant'];
}

function Legend({children, variant = 'subheader-3'}: LegendProps) {
    return (
        <Text variant={variant} color="secondary" className={b('legend')}>
            {children}
        </Text>
    );
}
function Value({children, variant = 'subheader-2'}: LegendProps) {
    return (
        <Text variant={variant} color="secondary" className={b('value')}>
            {children}
        </Text>
    );
}

interface DoughnutProps {
    status: ProgressStatus;
    fillWidth: number;
    children?: React.ReactNode;
    className?: string;
}

export function DoughnutMetrics({status, fillWidth, children, className}: DoughnutProps) {
    let gradientFill = 'var(--g-color-line-generic-solid)';
    let filledDegrees = fillWidth * 3.6 - 90;

    if (fillWidth > 50) {
        gradientFill = 'var(--doughnut-color)';
        filledDegrees = fillWidth * 3.6 + 90;
    }
    const gradientDegrees = filledDegrees;
    return (
        <div className={b(null, className)}>
            <div
                style={{
                    backgroundImage: `linear-gradient(${gradientDegrees}deg, transparent 50%, ${gradientFill} 50%), linear-gradient(-90deg, var(--g-color-line-generic-solid) 50%, transparent 50%)`,
                }}
                className={b('doughnut', {status})}
            >
                <div className={b('text-wrapper')}>{children}</div>
            </div>
        </div>
    );
}

DoughnutMetrics.Legend = Legend;
DoughnutMetrics.Value = Value;
