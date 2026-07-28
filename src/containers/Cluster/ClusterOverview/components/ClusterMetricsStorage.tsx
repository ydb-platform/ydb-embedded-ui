import {normalizeMediaType} from '../../../../utils/disks/normalizeMediaType';
import {formatStorageLegend} from '../../../../utils/metrics/formatMetricLegend';
import {getDiagramValues} from '../../../../utils/metrics/getDiagramValues';
import i18n from '../../i18n';
import type {ClusterMetricsCommonProps} from '../shared';

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
    const {status, percents, legend, progressValue} = getDiagramValues({
        value,
        capacity,
        legendFormatter: formatStorageLegend,
        ...rest,
    });

    const normalizedType = type ? normalizeMediaType(type) : type;

    const title = type
        ? i18n('title_storage-by-type', {type: normalizedType})
        : i18n('title_storage');

    return (
        <ClusterMetricsCardContent
            status={status}
            fillWidth={Math.max(progressValue, 0.5)}
            percents={percents}
            title={title}
            collapsed={collapsed}
            legend={{
                main: legend,
                secondary: title,
                note: type
                    ? i18n('context_storage-by-type-description')
                    : i18n('context_storage-total-description'),
            }}
        />
    );
}
