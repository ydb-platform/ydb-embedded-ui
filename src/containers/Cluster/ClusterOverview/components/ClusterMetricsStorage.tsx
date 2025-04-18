import {DoughnutMetrics} from '../../../../components/DoughnutMetrics/DoughnutMetrics';
import {formatStorageValues} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';
import type {ClusterMetricsCommonProps} from '../shared';
import {getDiagramValues} from '../utils';

import {ClusterMetricsCardContent} from './ClusterMetricsCard';

interface ClusterMetricsStorageProps extends ClusterMetricsCommonProps {
    groups: number;
}

function formatStorageLegend({value, capacity}: {value: number; capacity: number}) {
    const formatted = formatStorageValues(value, capacity, undefined, '\n');
    return `${formatted[0]} ${i18n('context_of')} ${formatted[1]}`;
}

export function ClusterMetricsStorage({
    value,
    capacity,
    groups,
    collapsed,
    ...rest
}: ClusterMetricsStorageProps) {
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
            title={i18n('title_storage')}
            collapsed={collapsed}
            legend={{
                main: legend,
                secondary: i18n('context_storage', {count: groups}),
                note: i18n('context_storage-description'),
            }}
        >
            <DoughnutMetrics.Value>{percents}</DoughnutMetrics.Value>
        </ClusterMetricsCardContent>
    );
}
