import React from 'react';

import {Label} from '@gravity-ui/uikit';

import type {PreparedStorageGroup} from '../../store/reducers/storage/types';
import {isCapacityAlert} from '../../types/api/enums';
import {getCapacityAlertTheme, normalizeCapacityAlert} from '../../utils/capacityAlerts';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import type {PreparedPDisk, PreparedVDisk} from '../../utils/disks/types';
import {
    formatMetricCount,
    formatMetricCountPair,
    formatMetricPercent,
    formatNormalizedMetricPercent,
    formatStorageMetricPair,
} from '../../utils/storageMetrics';
import type {InfoViewerItem} from '../InfoViewer';
import {TitleWithHelpMark} from '../TitleWithHelpmark/TitleWithHelpmark';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {
    CAPACITY_METRICS_COLUMN_TITLES,
    CAPACITY_METRICS_HELP_TEXT,
} from '../capacityMetricsColumns/constants';

import i18n from './i18n';

export interface DiskCapacityInfoItem {
    id: string;
    title: string;
    value: React.ReactNode;
    note?: string;
}

function getCapacityAlertValue(value: unknown): React.ReactNode {
    return normalizeCapacityAlert(value) ?? EMPTY_DATA_PLACEHOLDER;
}

function getAlertAwareUsageValue(value: string, capacityAlertValue: unknown): React.ReactNode {
    if (value === EMPTY_DATA_PLACEHOLDER) {
        return value;
    }

    const capacityAlert = normalizeCapacityAlert(capacityAlertValue);
    const theme = isCapacityAlert(capacityAlert) ? getCapacityAlertTheme(capacityAlert) : 'normal';

    return <Label theme={theme}>{value}</Label>;
}

export function getVDiskCapacityInfoItems(
    data: PreparedVDisk | undefined,
    {withRawUsage}: {withRawUsage: boolean},
): DiskCapacityInfoItem[] {
    const sizeData = data?.WhiteboardSize ?? data;
    const items: DiskCapacityInfoItem[] = [
        {
            id: 'size',
            title: i18n('field_size'),
            value: formatStorageMetricPair(sizeData?.AllocatedSize, sizeData?.SizeLimit),
        },
        {
            id: 'vdisk-slot-usage',
            title: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage,
            value: getAlertAwareUsageValue(
                formatMetricPercent(data?.VDiskSlotUsage),
                data?.CapacityAlert,
            ),
            note: CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage,
        },
    ];

    if (withRawUsage) {
        items.push({
            id: 'vdisk-raw-usage',
            title: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskRawUsage,
            value: formatMetricPercent(data?.VDiskRawUsage),
            note: CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage,
        });
    }

    items.push(
        {
            id: 'group-size-in-units',
            title: i18n('field_group-size-in-units'),
            value: formatMetricCount(data?.GroupSizeInUnits),
        },
        {
            id: 'capacity-alert',
            title: CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert,
            value: getCapacityAlertValue(data?.CapacityAlert),
            note: CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
        },
    );

    return items;
}

export function getPDiskCapacityInfoItems(
    data: PreparedPDisk | undefined,
    {withUsage, withCapacityAlert}: {withUsage: boolean; withCapacityAlert: boolean},
): DiskCapacityInfoItem[] {
    const sizeData = data?.WhiteboardSize ?? data;
    const items: DiskCapacityInfoItem[] = [
        {
            id: 'space',
            title: i18n('field_space'),
            value: formatStorageMetricPair(sizeData?.AllocatedSize, sizeData?.TotalSize),
        },
    ];

    if (withUsage) {
        items.push({
            id: 'pdisk-usage',
            title: CAPACITY_METRICS_COLUMN_TITLES.MaxPDiskUsage,
            value: formatMetricPercent(data?.PDiskUsage),
            note: CAPACITY_METRICS_HELP_TEXT.MaxPDiskUsage,
        });
    }

    items.push(
        {
            id: 'slots',
            title: i18n('field_slots'),
            value: formatMetricCountPair(data?.NumActiveSlots, data?.ExpectedSlotCount),
        },
        {
            id: 'slot-size-in-units',
            title: i18n('field_slot-size-in-units'),
            value: formatMetricCount(data?.SlotSizeInUnits),
        },
    );

    if (withCapacityAlert) {
        items.push({
            id: 'capacity-alert',
            title: CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert,
            value: getCapacityAlertValue(data?.PDiskCapacityAlert),
            note: CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
        });
    }

    return items;
}

export function getStorageGroupCapacityInfoItems(
    data: PreparedStorageGroup | undefined,
): DiskCapacityInfoItem[] {
    return [
        {
            id: 'vdisk-slot-usage',
            title: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage,
            value: getAlertAwareUsageValue(
                formatNormalizedMetricPercent(data?.MaxVDiskSlotUsage),
                data?.CapacityAlert,
            ),
            note: CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage,
        },
        {
            id: 'vdisk-raw-usage',
            title: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskRawUsage,
            value: formatNormalizedMetricPercent(data?.MaxVDiskRawUsage),
            note: CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage,
        },
        {
            id: 'capacity-alert',
            title: CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert,
            value: getCapacityAlertValue(data?.CapacityAlert),
            note: CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
        },
    ];
}

export function toDefinitionListItems(items: DiskCapacityInfoItem[]): YDBDefinitionListItem[] {
    return items.map(({title, value, note}) => ({name: title, content: value, note}));
}

export function toInfoViewerItems(items: DiskCapacityInfoItem[]): InfoViewerItem[] {
    return items.map(({title, value, note}) => ({
        label: note ? <TitleWithHelpMark header={title} note={note} /> : title,
        value,
    }));
}
