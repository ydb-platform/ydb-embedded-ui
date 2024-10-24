import {DoughnutMetrics} from '../../../../components/DoughnutMetrics/DoughnutMetrics';
import {formatNumber, formatNumericValues} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';
import type {ClusterMetricsCommonProps} from '../shared';
import {useDiagramValues} from '../utils';

import {ClusterMetricsCardDoughnut} from './ClusterMetricsCard';

interface ClusterMetricsCoresProps extends ClusterMetricsCommonProps {}

function formatCoresLegend({value, capacity}: {value: number; capacity: number}) {
    let formatted = [];
    if (capacity < 10_000) {
        formatted = [formatNumber(Math.round(value)), formatNumber(Math.round(capacity))];
    } else {
        formatted = formatNumericValues(value, capacity, undefined, '', true);
    }
    return `${formatted[0]} / ${formatted[1]}\n${i18n('context_cores')}`;
}

export function ClusterMetricsCores({value, capacity, ...rest}: ClusterMetricsCoresProps) {
    const {status, percents, legend, fill} = useDiagramValues({
        value,
        capacity,
        legendFormatter: formatCoresLegend,
        ...rest,
    });
    return (
        <ClusterMetricsCardDoughnut status={status} fillWidth={fill} title={i18n('title_cpu')}>
            <DoughnutMetrics.Legend>{legend}</DoughnutMetrics.Legend>
            <DoughnutMetrics.Value>{percents}</DoughnutMetrics.Value>
        </ClusterMetricsCardDoughnut>
    );
}
