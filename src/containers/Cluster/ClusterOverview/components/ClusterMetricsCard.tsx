import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {DoughnutMetrics} from '../../../../components/DoughnutMetrics/DoughnutMetrics';
import {EntityStatus} from '../../../../components/EntityStatusNew/EntityStatus';
import {Skeleton} from '../../../../components/Skeleton/Skeleton';
import {EFlag} from '../../../../types/api/enums';
import type {ProgressStatus} from '../../../../utils/progress';
import {b} from '../shared';

const ProgressStatusToEFlag: Record<ProgressStatus, EFlag> = {
    good: EFlag.Green,
    warning: EFlag.Yellow,
    danger: EFlag.Red,
};

interface ClusterMetricsDougnutCardProps extends ClusterMetricsCommonCardProps {
    status: ProgressStatus;
    fillWidth: number;
    legend: {main?: string; secondary?: string; note?: React.ReactNode};
}

interface ClusterMetricsCommonCardProps {
    children?: React.ReactNode;
    title?: string;
    className?: string;
    collapsed?: boolean;
}

export function ClusterMetricsCard({children, className}: ClusterMetricsCommonCardProps) {
    return (
        <Flex gap="6" alignItems="center" className={b('card', className)}>
            {children}
        </Flex>
    );
}

export function ClusterMetricsCardContent({
    title,
    children,
    legend,
    collapsed,
    ...rest
}: ClusterMetricsDougnutCardProps) {
    const {main: mainLegend, secondary: secondaryLegend, note: legendNote} = legend;

    if (collapsed) {
        const {status, fillWidth} = rest;
        const normalizedFillWidth = fillWidth.toFixed(fillWidth > 0 ? 0 : 1);

        return (
            <EntityStatus.Label withStatusName={false} status={ProgressStatusToEFlag[status]}>
                {`${title} : ${normalizedFillWidth}%`}
            </EntityStatus.Label>
        );
    }
    return (
        <ClusterMetricsCard>
            <DoughnutMetrics {...rest}>{children}</DoughnutMetrics>
            <div className={b('legend-wrapper')}>
                {mainLegend && <DoughnutMetrics.Legend>{mainLegend}</DoughnutMetrics.Legend>}
                {secondaryLegend && (
                    <DoughnutMetrics.Legend color="secondary" note={legendNote} variant="body-1">
                        {secondaryLegend}
                    </DoughnutMetrics.Legend>
                )}
            </div>
        </ClusterMetricsCard>
    );
}

function ClusterMetricsCardSkeleton() {
    return (
        <ClusterMetricsCard className={b('skeleton-wrapper')}>
            <Skeleton className={b('skeleton')} />
        </ClusterMetricsCard>
    );
}

export function ClusterDashboardSkeleton() {
    return (
        <React.Fragment>
            <ClusterMetricsCardSkeleton />
            <ClusterMetricsCardSkeleton />
            <ClusterMetricsCardSkeleton />
        </React.Fragment>
    );
}
