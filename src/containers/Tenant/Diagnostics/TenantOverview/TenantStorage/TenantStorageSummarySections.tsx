import {Flex, Text} from '@gravity-ui/uikit';

import {EType} from '../../../../../types/api/tenant';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';

import {GroupedSummaryCard, SummaryCard} from './TenantStorageSummaryCard';
import type {GroupedSummaryCardRow} from './TenantStorageSummaryCard';
import {
    formatOverheadValue,
    formatTenantStorageApproximateMetric,
    formatTenantStorageSummaryMetric,
    getTenantStorageLegendValueFormatter,
    getTenantStorageSegmentValueFormatters,
    getTenantStorageSummaryMetricUnit,
} from './displayFormatters';
import i18n from './i18n';
import type {
    TenantStorageData,
    TenantStorageMediaSection,
    TenantStorageSegment,
    TenantStorageSummary,
    TenantStorageSystemDetail,
} from './utils';
import {
    getTenantStoragePhysicalDisplaySegments,
    getTenantStoragePhysicalMediaBreakdown,
    getTenantStorageSegmentDisplayValue,
    getTenantStorageUserDataDisplaySummary,
    mergeSystemDetailsByMedia,
} from './utils';

import './TenantStorageSummarySections.scss';

const b = cn('ydb-tenant-storage-summary-sections');

function getMediaSectionLabel(mediaType?: string) {
    if (!mediaType || mediaType === EType.None) {
        return undefined;
    }

    return mediaType;
}

function getUserSummaryRow({
    id,
    mediaLabel,
    segments,
    summary,
}: {
    id: string;
    mediaLabel?: string;
    segments?: TenantStorageSegment[];
    summary: TenantStorageSummary;
}): GroupedSummaryCardRow {
    const metricsSize = getTenantStorageSummaryMetricUnit([
        summary.available,
        summary.used,
        summary.quota,
    ]);

    const {formatLegendValue, formatTooltipValue} = getTenantStorageSegmentValueFormatters(
        (segments ?? []).map(getTenantStorageSegmentDisplayValue),
    );
    const formattedAvailableValue = summary.availableApproximate
        ? formatTenantStorageApproximateMetric(summary.available, metricsSize)
        : formatTenantStorageSummaryMetric(summary.available, metricsSize);
    const hasQuota = summary.quota !== undefined;

    return {
        id,
        mediaLabel,
        summary,
        segments,
        formatLegendValue,
        formatTooltipValue,
        tooltipTotalLabel: i18n('value_total-user-data'),
        metrics: [
            {
                hideDivider: true,
                label: i18n('field_available'),
                note: summary.availableApproximate
                    ? i18n('context_available-approximate')
                    : undefined,
                value: formattedAvailableValue,
            },
            {
                label: i18n('field_used'),
                value: formatTenantStorageSummaryMetric(summary.used, metricsSize),
            },
            {
                label: i18n('field_quota'),
                note: hasQuota ? undefined : i18n('alert_missing-quota-description'),
                notePlacement: 'value',
                noteTitle: hasQuota ? undefined : i18n('alert_missing-quota-title'),
                value: hasQuota
                    ? formatTenantStorageSummaryMetric(summary.quota, metricsSize)
                    : EMPTY_DATA_PLACEHOLDER,
            },
        ],
    };
}

function renderUserSummary(summary: TenantStorageSummary, segments?: TenantStorageSegment[]) {
    const row = getUserSummaryRow({id: 'user-data', summary, segments});

    return (
        <SummaryCard
            title={i18n('title_user-data')}
            description={i18n('context_user-data-by-type')}
            descriptionHelpText={i18n('context_user-data-tooltip')}
            position="first"
            {...row}
        />
    );
}

function getPhysicalSummaryRow({
    id,
    mediaLabel,
    segments,
    summary,
    systemDetails,
}: {
    id: string;
    mediaLabel?: string;
    segments?: TenantStorageSegment[];
    summary: TenantStorageSummary;
    systemDetails?: TenantStorageSystemDetail[];
}): GroupedSummaryCardRow {
    const metricsSize = getTenantStorageSummaryMetricUnit([
        summary.available,
        summary.used,
        summary.total,
    ]);

    const {formatLegendValue, formatTooltipValue} = getTenantStorageSegmentValueFormatters(
        (segments ?? []).map(getTenantStorageSegmentDisplayValue),
    );
    const formatSystemDetailValue = getTenantStorageLegendValueFormatter(
        (systemDetails ?? []).map((detail) => detail.value),
    );

    return {
        id,
        mediaLabel,
        summary,
        segments,
        formatLegendValue,
        formatSystemDetailValue,
        formatTooltipValue,
        tooltipTotalLabel: i18n('value_total-physical-disk-usage'),
        displayNoLimit: 'filled',
        systemDetails,
        metrics: [
            {
                emphasize: true,
                label: i18n('field_overhead'),
                note: i18n('context_overhead-description'),
                value: formatOverheadValue(summary.overhead),
            },
            {
                hideDivider: true,
                label: i18n('field_available'),
                value: formatTenantStorageSummaryMetric(summary.available, metricsSize),
            },
            {
                label: i18n('field_used'),
                value: formatTenantStorageSummaryMetric(summary.used, metricsSize),
            },
            {
                label: i18n('field_total'),
                value: formatTenantStorageSummaryMetric(summary.total, metricsSize),
            },
        ],
    };
}

function renderPhysicalSummary(
    summary: TenantStorageSummary,
    segments?: TenantStorageSegment[],
    systemDetails?: TenantStorageSystemDetail[],
) {
    const row = getPhysicalSummaryRow({id: 'physical', summary, segments, systemDetails});

    return (
        <SummaryCard
            title={i18n('title_physical-disk-usage')}
            description={i18n('context_physical-disk-usage-description')}
            position="last"
            {...row}
        />
    );
}

function getMediaSectionRows({
    data,
    index = 0,
    section,
    showMediaTypeLabel,
}: {
    data: TenantStorageData;
    index?: number;
    section: TenantStorageMediaSection;
    showMediaTypeLabel: boolean;
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
        const mediaBreakdown = getTenantStoragePhysicalMediaBreakdown({
            allowAggregateFallback: !showMediaTypeLabel,
            mediaType: section.mediaType,
            physicalSegmentsByMedia: data.physicalSegmentsByMedia,
            systemDetailsByMedia: data.systemDetailsByMedia,
        });

        physicalSegments = getTenantStoragePhysicalDisplaySegments({
            segments: mediaBreakdown.segments,
            used: section.physical.used,
        });
        systemDetails = mediaBreakdown.systemDetails;
    }

    return {
        mediaLabel,
        physical: getPhysicalSummaryRow({
            id: `physical-${section.mediaType}-${index}`,
            mediaLabel,
            summary: section.physical,
            segments: physicalSegments,
            systemDetails,
        }),
        user: getUserSummaryRow({
            id: `user-${section.mediaType}-${index}`,
            mediaLabel,
            summary: userDataSummary,
            segments: userSegments,
        }),
    };
}

interface TenantStorageMediaSectionViewProps {
    section: TenantStorageMediaSection;
    showMediaTypeLabel: boolean;
    data: TenantStorageData;
    showPhysicalDiskUsage?: boolean;
}

export function TenantStorageMediaSectionView({
    section,
    showMediaTypeLabel,
    data,
    showPhysicalDiskUsage,
}: TenantStorageMediaSectionViewProps) {
    const {mediaLabel, physical, user} = getMediaSectionRows({
        data,
        section,
        showMediaTypeLabel,
    });

    return (
        <Flex direction="column" gap={1} className={b()}>
            {showMediaTypeLabel && mediaLabel ? (
                <Text variant="subheader-2" className={b('media-title')}>
                    {mediaLabel}
                </Text>
            ) : null}
            {renderUserSummary(user.summary, user.segments)}
            {showPhysicalDiskUsage
                ? renderPhysicalSummary(physical.summary, physical.segments, physical.systemDetails)
                : null}
        </Flex>
    );
}

interface TenantStorageGroupedMediaSectionsViewProps {
    data: TenantStorageData;
    sections: TenantStorageMediaSection[];
    showPhysicalDiskUsage?: boolean;
}

export function TenantStorageGroupedMediaSectionsView({
    data,
    sections,
    showPhysicalDiskUsage,
}: TenantStorageGroupedMediaSectionsViewProps) {
    const rows = sections.map((section, index) => {
        return getMediaSectionRows({
            data,
            index,
            section,
            showMediaTypeLabel: true,
        });
    });

    return (
        <Flex direction="column" gap={1} className={b({grouped: true})}>
            <GroupedSummaryCard
                title={i18n('title_user-data')}
                description={i18n('context_user-data-by-type')}
                descriptionHelpText={i18n('context_user-data-tooltip')}
                position="first"
                rows={rows.map((row) => row.user)}
            />
            {showPhysicalDiskUsage ? (
                <GroupedSummaryCard
                    title={i18n('title_physical-disk-usage')}
                    description={i18n('context_physical-disk-usage-description')}
                    position="last"
                    rows={rows.map((row) => row.physical)}
                />
            ) : null}
        </Flex>
    );
}
