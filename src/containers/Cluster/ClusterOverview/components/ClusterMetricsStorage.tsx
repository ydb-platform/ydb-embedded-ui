import {DoughnutMetrics} from '../../../../components/DoughnutMetrics/DoughnutMetrics';
import {formatStorageLegend} from '../../../../utils/metrics/formatMetricLegend';
import i18n from '../../i18n';
import type {ClusterMetricsCommonProps} from '../shared';
import {getDiagramValues} from '../utils';

import {ClusterMetricsCardContent} from './ClusterMetricsCard';

interface ClusterMetricsStorageProps extends ClusterMetricsCommonProps {
    type?: string;
}

export function ClusterMetricsStorage({
    value,
    type,
    capacity,
    collapsed,
    ...rest
}: ClusterMetricsStorageProps) {
    const {status, percents, legend, fill} = getDiagramValues({
        value,
        capacity,
        legendFormatter: formatStorageLegend,
        ...rest,
    });

    const normalizedType = type === 'ROT' ? 'HDD' : type;

    const title = type
        ? i18n('title_storage-by-type', {type: normalizedType})
        : i18n('title_storage');

    return (
        <ClusterMetricsCardContent
            status={status}
            fillWidth={fill}
            title={title}
            collapsed={collapsed}
            legend={{
                main: legend,
                secondary: title,
                note: type
                    ? i18n('context_storage-by-type-description')
                    : i18n('context_storage-total-description'),
            }}
        >
            <DoughnutMetrics.Value>{percents}</DoughnutMetrics.Value>
        </ClusterMetricsCardContent>
    );
}
