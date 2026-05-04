import {Flex, Text} from '@gravity-ui/uikit';

import {EType} from '../../../../../types/api/tenant';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatMetricBytes, getConsistentMetricBytesSize} from '../../../../../utils/storageMetrics';
import i18n from '../i18n';

import {SummaryCard} from './TenantStorageSummaryCard';
import {formatOverheadValue, formatSummaryMetricBytes} from './displayFormatters';
import type {
    TenantStorageData,
    TenantStorageMediaSection,
    TenantStorageSegment,
    TenantStorageSummary,
    TenantStorageSystemDetail,
} from './utils';
import {
    getTenantStorageMediaKey,
    getTenantStoragePhysicalDisplaySegments,
    getTenantStorageUserDataDisplaySummary,
    mergeSystemDetailsByMedia,
} from './utils';

import './TenantStorageSummarySections.scss';

const b = cn('ydb-tenant-storage-summary-sections');

function getMediaSectionLabel(mediaType?: EType) {
    if (!mediaType || mediaType === EType.None) {
        return undefined;
    }

    return mediaType;
}

function renderUserSummary(summary: TenantStorageSummary, segments?: TenantStorageSegment[]) {
    const metricsSize = getConsistentMetricBytesSize([
        summary.available,
        summary.used,
        summary.quota,
    ]);

    const formatLegendValue = (value: number) => formatMetricBytes(value, metricsSize);
    const availableValue = formatSummaryMetricBytes(summary.available, metricsSize);
    const formattedAvailableValue =
        summary.availableApproximate && availableValue !== EMPTY_DATA_PLACEHOLDER
            ? `~${availableValue}`
            : availableValue;

    return (
        <SummaryCard
            title={i18n('storage.new.user-data-title')}
            description={i18n('storage.new.user-data-description')}
            summary={summary}
            descriptionHelpText={i18n('storage.new.user-data-description-tooltip')}
            segments={segments}
            formatLegendValue={formatLegendValue}
            position="first"
            tooltipTotalLabel={i18n('storage.new.context-total-user-data')}
            metrics={[
                {
                    hideDivider: true,
                    label: i18n('storage.new.available'),
                    note: summary.availableApproximate
                        ? i18n('storage.new.available-approximate-description')
                        : undefined,
                    value: formattedAvailableValue,
                },
                {
                    label: i18n('storage.new.used'),
                    value: formatSummaryMetricBytes(summary.used, metricsSize),
                },
                {
                    label: i18n('storage.new.quota'),
                    value:
                        summary.quota === undefined
                            ? EMPTY_DATA_PLACEHOLDER
                            : formatSummaryMetricBytes(summary.quota, metricsSize),
                },
            ]}
        />
    );
}

function renderPhysicalSummary(
    summary: TenantStorageSummary,
    segments?: TenantStorageSegment[],
    systemDetails?: TenantStorageSystemDetail[],
) {
    const metricsSize = getConsistentMetricBytesSize([
        summary.available,
        summary.used,
        summary.total,
    ]);

    const formatLegendValue = (value: number) => formatMetricBytes(value, metricsSize);
    const systemDetailsSize = getConsistentMetricBytesSize(
        (systemDetails ?? []).map((detail) => detail.value),
    );
    const formatSystemDetailValue = (value: number) => formatMetricBytes(value, systemDetailsSize);

    return (
        <SummaryCard
            title={i18n('storage.new.physical-title')}
            description={i18n('storage.new.physical-description')}
            summary={summary}
            segments={segments}
            formatLegendValue={formatLegendValue}
            formatSystemDetailValue={formatSystemDetailValue}
            position="last"
            tooltipTotalLabel={i18n('storage.new.context-total-physical-disk-usage')}
            metrics={[
                {
                    emphasize: true,
                    label: i18n('storage.new.overhead'),
                    note: i18n('storage.new.overhead-description'),
                    value: formatOverheadValue(summary.overhead),
                },
                {
                    hideDivider: true,
                    label: i18n('storage.new.available'),
                    value: formatSummaryMetricBytes(summary.available, metricsSize),
                },
                {
                    label: i18n('storage.new.used'),
                    value: formatSummaryMetricBytes(summary.used, metricsSize),
                },
                {
                    label: i18n('storage.new.total'),
                    value: formatSummaryMetricBytes(summary.total, metricsSize),
                },
            ]}
            displayNoLimit="filled"
            systemDetails={systemDetails}
        />
    );
}

export function TenantStorageMediaSectionView({
    section,
    showMediaTypeLabel,
    data,
}: {
    section: TenantStorageMediaSection;
    showMediaTypeLabel: boolean;
    data: TenantStorageData;
}) {
    const mediaLabel = getMediaSectionLabel(section.mediaType);
    const userDataSummary = getTenantStorageUserDataDisplaySummary({
        summary: section.userData,
        logicalUserData: data.logicalUserData,
        useLogicalBreakdown: !showMediaTypeLabel,
        physical: section.physical,
    });
    const userSegments = showMediaTypeLabel ? undefined : data.userDataSegments;
    let physicalSegments: TenantStorageSegment[];
    let systemDetails: TenantStorageSystemDetail[] | undefined;

    if (section.mediaType === EType.None) {
        physicalSegments = data.summary.physical.segments;
        systemDetails = mergeSystemDetailsByMedia(data.systemDetailsByMedia);
    } else {
        const mediaBreakdownKey = getTenantStorageMediaKey(section.mediaType);

        physicalSegments = getTenantStoragePhysicalDisplaySegments({
            segments: data.physicalSegmentsByMedia[mediaBreakdownKey],
            used: section.physical.used,
        });
        systemDetails = data.systemDetailsByMedia[mediaBreakdownKey];
    }

    return (
        <Flex direction="column" gap={3} className={b()}>
            {showMediaTypeLabel && mediaLabel ? (
                <Text variant="subheader-2" className={b('media-title')}>
                    {mediaLabel}
                </Text>
            ) : null}
            {renderUserSummary(userDataSummary, userSegments)}
            {renderPhysicalSummary(section.physical, physicalSegments, systemDetails)}
        </Flex>
    );
}
