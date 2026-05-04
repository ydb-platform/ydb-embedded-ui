import {Flex, Text} from '@gravity-ui/uikit';

import {EType} from '../../../../../types/api/tenant';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import i18n from '../i18n';

import {GroupedSummaryCard, SummaryCard} from './TenantStorageSummaryCard';
import type {GroupedSummaryCardRow} from './TenantStorageSummaryCard';
import {
    formatOverheadValue,
    formatTenantStorageApproximateMetric,
    formatTenantStorageSummaryMetric,
    formatTenantStorageTooltipMetric,
    getTenantStorageLegendValueFormatter,
    getTenantStorageSummaryMetricUnit,
} from './displayFormatters';
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

    const formatLegendValue = getTenantStorageLegendValueFormatter(
        (segments ?? []).map((segment) => segment.value),
    );
    const formattedAvailableValue = summary.availableApproximate
        ? formatTenantStorageApproximateMetric(summary.available, metricsSize)
        : formatTenantStorageSummaryMetric(summary.available, metricsSize);

    return {
        id,
        mediaLabel,
        summary,
        segments,
        formatLegendValue,
        formatTooltipValue: formatTenantStorageTooltipMetric,
        tooltipTotalLabel: i18n('storage.new.context-total-user-data'),
        metrics: [
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
                value: formatTenantStorageSummaryMetric(summary.used, metricsSize),
            },
            {
                label: i18n('storage.new.quota'),
                value:
                    summary.quota === undefined
                        ? EMPTY_DATA_PLACEHOLDER
                        : formatTenantStorageSummaryMetric(summary.quota, metricsSize),
            },
        ],
    };
}

function renderUserSummary(summary: TenantStorageSummary, segments?: TenantStorageSegment[]) {
    const row = getUserSummaryRow({id: 'user-data', summary, segments});

    return (
        <SummaryCard
            title={i18n('storage.new.user-data-title')}
            description={i18n('storage.new.user-data-description')}
            descriptionHelpText={i18n('storage.new.user-data-description-tooltip')}
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

    const formatLegendValue = getTenantStorageLegendValueFormatter(
        (segments ?? []).map((segment) => segment.value),
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
        formatTooltipValue: formatTenantStorageTooltipMetric,
        tooltipTotalLabel: i18n('storage.new.context-total-physical-disk-usage'),
        displayNoLimit: 'filled',
        systemDetails,
        metrics: [
            {
                emphasize: true,
                label: i18n('storage.new.overhead'),
                note: i18n('storage.new.overhead-description'),
                value: formatOverheadValue(summary.overhead),
            },
            {
                hideDivider: true,
                label: i18n('storage.new.available'),
                value: formatTenantStorageSummaryMetric(summary.available, metricsSize),
            },
            {
                label: i18n('storage.new.used'),
                value: formatTenantStorageSummaryMetric(summary.used, metricsSize),
            },
            {
                label: i18n('storage.new.total'),
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
            title={i18n('storage.new.physical-title')}
            description={i18n('storage.new.physical-description')}
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
        const mediaBreakdownKey = getTenantStorageMediaKey(section.mediaType);

        physicalSegments = getTenantStoragePhysicalDisplaySegments({
            segments: data.physicalSegmentsByMedia[mediaBreakdownKey],
            used: section.physical.used,
        });
        systemDetails = data.systemDetailsByMedia[mediaBreakdownKey];
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

export function TenantStorageMediaSectionView({
    section,
    showMediaTypeLabel,
    data,
}: {
    section: TenantStorageMediaSection;
    showMediaTypeLabel: boolean;
    data: TenantStorageData;
}) {
    const {mediaLabel, physical, user} = getMediaSectionRows({
        data,
        section,
        showMediaTypeLabel,
    });

    return (
        <Flex direction="column" gap={3} className={b()}>
            {showMediaTypeLabel && mediaLabel ? (
                <Text variant="subheader-2" className={b('media-title')}>
                    {mediaLabel}
                </Text>
            ) : null}
            {renderUserSummary(user.summary, user.segments)}
            {renderPhysicalSummary(physical.summary, physical.segments, physical.systemDetails)}
        </Flex>
    );
}

export function TenantStorageGroupedMediaSectionsView({
    data,
    sections,
}: {
    data: TenantStorageData;
    sections: TenantStorageMediaSection[];
}) {
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
                title={i18n('storage.new.user-data-title')}
                description={i18n('storage.new.user-data-description')}
                descriptionHelpText={i18n('storage.new.user-data-description-tooltip')}
                position="first"
                rows={rows.map((row) => row.user)}
            />
            <GroupedSummaryCard
                title={i18n('storage.new.physical-title')}
                description={i18n('storage.new.physical-description')}
                position="last"
                rows={rows.map((row) => row.physical)}
            />
        </Flex>
    );
}
