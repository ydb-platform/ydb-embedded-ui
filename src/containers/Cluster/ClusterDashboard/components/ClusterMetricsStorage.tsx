import {DoughnutMetrics} from '../../../../components/DoughnutMetrics/DoughnutMetrics';
import {formatStorageValues} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';
import type {ClusterMetricsCommonProps} from '../shared';
import {useDiagramValues} from '../utils';

import {ClusterMetricsCardDoughnut} from './ClusterMetricsCard';

interface ClusterMetricsStorageProps extends ClusterMetricsCommonProps {}

function formatStorageLegend({value, capacity}: {value: number; capacity: number}) {
    const formatted = formatStorageValues(value, capacity, undefined, '\n');
    return `${formatted[0]} / ${formatted[1]}`;
}

export function ClusterMetricsStorage({value, capacity, ...rest}: ClusterMetricsStorageProps) {
    const {status, percents, legend, fill} = useDiagramValues({
        value,
        capacity,
        legendFormatter: formatStorageLegend,
        ...rest,
    });

    return (
        <ClusterMetricsCardDoughnut status={status} fillWidth={fill} title={i18n('title_storage')}>
            <DoughnutMetrics.Legend>{legend}</DoughnutMetrics.Legend>
            <DoughnutMetrics.Value>{percents}</DoughnutMetrics.Value>
        </ClusterMetricsCardDoughnut>
    );
}
