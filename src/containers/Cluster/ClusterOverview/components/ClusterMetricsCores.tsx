import {formatCoresLegend} from '../../../../utils/metrics/formatMetricLegend';
import {getDiagramValues} from '../../../../utils/metrics/getDiagramValues';
import i18n from '../../i18n';
import type {ClusterMetricsCommonProps} from '../shared';

import {ClusterMetricsCardContent} from './ClusterMetricsCard';

interface ClusterMetricsCoresProps extends ClusterMetricsCommonProps {}

export function ClusterMetricsCores({
    collapsed,
    value,
    capacity,
    ...rest
}: ClusterMetricsCoresProps) {
    const {status, percents, legend, progressValue} = getDiagramValues({
        value,
        capacity,
        legendFormatter: formatCoresLegend,
        ...rest,
    });

    return (
        <ClusterMetricsCardContent
            collapsed={collapsed}
            status={status}
            fillWidth={Math.max(progressValue, 0.5)}
            percents={percents}
            title={i18n('title_cpu')}
            legend={{
                main: legend,
                secondary: i18n('context_cpu'),
                note: i18n('context_cpu-description'),
            }}
        />
    );
}
