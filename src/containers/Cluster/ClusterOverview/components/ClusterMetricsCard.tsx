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

interface ClusterMetricsDougnutCardProps extends Omit<ClusterMetricsCommonCardProps, 'children'> {
    status: ProgressStatus;
    fillWidth: number;
    percents: string;
    legend: {main?: string; secondary?: string; note?: React.ReactNode};
}

interface ClusterMetricsCommonCardProps {
    children?: React.ReactNode;
    title?: string;
    className?: string;
    collapsed?: boolean;
}

export function ClusterMetricsCard({
    children,
    className,
    collapsed,
}: ClusterMetricsCommonCardProps) {
    return (
        <Flex gap="6" alignItems="center" className={b('card', {collapsed}, className)}>
            {children}
        </Flex>
    );
}

export function ClusterMetricsCardContent({
    title,
    percents,
    legend,
    collapsed,
    ...rest
}: ClusterMetricsDougnutCardProps) {
    const {main: mainLegend, secondary: secondaryLegend, note: legendNote} = legend;

    if (collapsed) {
        const {status} = rest;

        return (
            <EntityStatus.Label withStatusName={false} status={ProgressStatusToEFlag[status]}>
                {`${title} : ${percents}`}
            </EntityStatus.Label>
        );
    }
    return (
        <ClusterMetricsCard>
            <DoughnutMetrics {...rest}>
                <DoughnutMetrics.Value>{percents}</DoughnutMetrics.Value>
            </DoughnutMetrics>
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

interface ClusterMetricsCardSkeletonProps {
    collapsed?: boolean;
}

function ClusterMetricsCardSkeleton({collapsed}: ClusterMetricsCardSkeletonProps) {
    return (
        <ClusterMetricsCard className={b('skeleton-wrapper')} collapsed={collapsed}>
            <Skeleton className={b('skeleton')} />
        </ClusterMetricsCard>
    );
}

export function ClusterDashboardSkeleton({collapsed}: ClusterMetricsCardSkeletonProps) {
    return (
        <React.Fragment>
            <ClusterMetricsCardSkeleton collapsed={collapsed} />
            <ClusterMetricsCardSkeleton collapsed={collapsed} />
            <ClusterMetricsCardSkeleton collapsed={collapsed} />
        </React.Fragment>
    );
}
