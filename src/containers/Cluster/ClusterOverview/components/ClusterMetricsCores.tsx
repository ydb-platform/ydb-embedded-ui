import {DoughnutMetrics} from '../../../../components/DoughnutMetrics/DoughnutMetrics';
import {formatCoresLegend} from '../../../../utils/metrics/formatMetricLegend';
import i18n from '../../i18n';
import type {ClusterMetricsCommonProps} from '../shared';
import {getDiagramValues} from '../utils';

import {ClusterMetricsCardContent} from './ClusterMetricsCard';

interface ClusterMetricsCoresProps extends ClusterMetricsCommonProps {}

export function ClusterMetricsCores({
    collapsed,
    value,
    capacity,
    ...rest
}: ClusterMetricsCoresProps) {
    const {status, percents, legend, fill} = getDiagramValues({
        value,
        capacity,
        legendFormatter: formatCoresLegend,
        ...rest,
    });

    return (
        <ClusterMetricsCardContent
            collapsed={collapsed}
            status={status}
            fillWidth={fill}
            title={i18n('title_cpu')}
            legend={{
                main: legend,
                secondary: i18n('context_cpu'),
                note: i18n('context_cpu-description'),
            }}
        >
            <DoughnutMetrics.Value>{percents}</DoughnutMetrics.Value>
        </ClusterMetricsCardContent>
    );
}
