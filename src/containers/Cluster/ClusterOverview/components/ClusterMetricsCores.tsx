import {DoughnutMetrics} from '../../../../components/DoughnutMetrics/DoughnutMetrics';
import {formatNumber, formatNumericValues} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';
import type {ClusterMetricsCommonProps} from '../shared';
import {getDiagramValues} from '../utils';

import {ClusterMetricsCardContent} from './ClusterMetricsCard';

interface ClusterMetricsCoresProps extends ClusterMetricsCommonProps {}

function formatCoresLegend({value, capacity}: {value: number; capacity: number}) {
    let formatted = [];
    if (capacity < 10_000) {
        formatted = [formatNumber(Math.round(value)), formatNumber(Math.round(capacity))];
    } else {
        formatted = formatNumericValues(value, capacity, undefined, '', true);
    }
    return `${formatted[0]} ${i18n('context_of')} ${formatted[1]} ${i18n('context_cores')}`;
}

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
