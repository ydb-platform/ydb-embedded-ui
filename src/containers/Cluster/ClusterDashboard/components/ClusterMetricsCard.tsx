import {Text} from '@gravity-ui/uikit';

import type {DiagnosticCardProps} from '../../../../components/DiagnosticCard/DiagnosticCard';
import {DiagnosticCard} from '../../../../components/DiagnosticCard/DiagnosticCard';
import {DoughnutMetrics} from '../../../../components/DoughnutMetrics/DoughnutMetrics';
import {Skeleton} from '../../../../components/Skeleton/Skeleton';
import type {ProgressStatus} from '../../../../utils/progress';
import {b} from '../shared';

interface ClusterMetricsDougnutCardProps extends ClusterMetricsCommonCardProps {
    status: ProgressStatus;
    fillWidth: number;
}

interface ClusterMetricsCommonCardProps {
    children?: React.ReactNode;
    title?: string;
    size?: DiagnosticCardProps['size'];
    className?: string;
}

export function ClusterMetricsCard({
    children,
    title,
    size,
    className,
}: ClusterMetricsCommonCardProps) {
    return (
        <DiagnosticCard className={b('card', {size}, className)} size={size} interactive={false}>
            {title ? (
                <Text variant="subheader-3" className={b('card-title')}>
                    {title}
                </Text>
            ) : null}
            {children}
        </DiagnosticCard>
    );
}

export function ClusterMetricsCardDoughnut({
    title,
    children,
    size,
    ...rest
}: ClusterMetricsDougnutCardProps) {
    return (
        <ClusterMetricsCard title={title} size={size}>
            <DoughnutMetrics {...rest} className={b('doughtnut')}>
                {children}
            </DoughnutMetrics>
        </ClusterMetricsCard>
    );
}

export function ClusterMetricsCardSkeleton() {
    return (
        <ClusterMetricsCard className={b('skeleton-wrapper')}>
            <Skeleton className={b('skeleton')} />
        </ClusterMetricsCard>
    );
}
