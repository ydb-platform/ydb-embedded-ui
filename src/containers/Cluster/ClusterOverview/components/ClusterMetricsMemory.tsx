import {formatStorageLegend} from '../../../../utils/metrics/formatMetricLegend';
import {getDiagramValues} from '../../../../utils/metrics/getDiagramValues';
import i18n from '../../i18n';
import type {ClusterMetricsCommonProps} from '../shared';

import {ClusterMetricsCardContent} from './ClusterMetricsCard';

interface ClusterMetricsMemoryProps extends ClusterMetricsCommonProps {}

export function ClusterMetricsMemory({
    value,
    capacity,
    collapsed,
    ...rest
}: ClusterMetricsMemoryProps) {
    const {status, percents, legend, progressValue} = getDiagramValues({
        value,
        capacity,
        legendFormatter: formatStorageLegend,
        ...rest,
    });

    return (
        <ClusterMetricsCardContent
            status={status}
            fillWidth={Math.max(progressValue, 0.5)}
            percents={percents}
            title={i18n('title_memory')}
            collapsed={collapsed}
            legend={{
                main: legend,
                secondary: i18n('context_memory'),
                note: i18n('context_memory-description'),
            }}
        />
    );
}
