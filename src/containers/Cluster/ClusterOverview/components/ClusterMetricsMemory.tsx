import {DoughnutMetrics} from '../../../../components/DoughnutMetrics/DoughnutMetrics';
import {formatStorageValues} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';
import type {ClusterMetricsCommonProps} from '../shared';
import {getDiagramValues} from '../utils';

import {ClusterMetricsCardContent} from './ClusterMetricsCard';

interface ClusterMetricsMemoryProps extends ClusterMetricsCommonProps {}

function formatStorageLegend({value, capacity}: {value: number; capacity: number}) {
    const formatted = formatStorageValues(value, capacity, undefined, '\n');
    return `${formatted[0]} ${i18n('context_of')} ${formatted[1]}`;
}

export function ClusterMetricsMemory({
    value,
    capacity,
    collapsed,
    ...rest
}: ClusterMetricsMemoryProps) {
    const {status, percents, legend, fill} = getDiagramValues({
        value,
        capacity,
        legendFormatter: formatStorageLegend,
        ...rest,
    });

    return (
        <ClusterMetricsCardContent
            status={status}
            fillWidth={fill}
            title={i18n('title_memory')}
            collapsed={collapsed}
            legend={{
                main: legend,
                secondary: i18n('context_memory'),
                note: i18n('context_memory-description'),
            }}
        >
            <DoughnutMetrics.Value>{percents}</DoughnutMetrics.Value>
        </ClusterMetricsCardContent>
    );
}
