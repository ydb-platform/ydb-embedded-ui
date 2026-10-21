import type {PreparedStorageGroup} from '../../store/reducers/storage/types';
import {normalizeCapacityAlert} from '../../utils/capacityAlerts';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import type {DiskDetailItem} from '../../utils/disks/diskInfo/getDiskLocationItems';
import type {PreparedPDisk, PreparedVDisk} from '../../utils/disks/types';
import {
    formatMetricCountPair,
    formatMetricPercent,
    formatNormalizedMetricPercent,
    formatStorageMetricPair,
} from '../../utils/storageMetrics';
import {DiskCapacityAlertLabel} from '../DiskStatus/DiskStatus';
import {pDiskInfoKeyset} from '../PDiskInfo/i18n';
import {vDiskInfoKeyset} from '../VDiskInfo/i18n';
import {
    CAPACITY_CONFIGURATION_HELP_TEXT,
    CAPACITY_METRICS_COLUMN_TITLES,
    CAPACITY_METRICS_HELP_TEXT,
} from '../capacityMetricsColumns/constants';
import {formatCapacityUnitCount} from '../capacityMetricsColumns/formatters';

import i18n from './i18n';

export function getVDiskCapacityItems(
    data: PreparedVDisk,
    {capacityMetricsEnabled}: {capacityMetricsEnabled: boolean},
): DiskDetailItem[] {
    const size =
        (capacityMetricsEnabled ? data.WhiteboardSize : undefined) ?? data.DisplaySize ?? data;
    const items: DiskDetailItem[] = [
        {
            id: 'group-size-in-units',
            name: vDiskInfoKeyset('field_group-size-in-units'),
            content: formatCapacityUnitCount(data.GroupSizeInUnits),
            note: CAPACITY_CONFIGURATION_HELP_TEXT.GroupSizeInUnits,
        },
        {
            id: 'size',
            name: vDiskInfoKeyset('size'),
            content: formatStorageMetricPair(size.AllocatedSize, size.SizeLimit, 2),
        },
        {
            id: 'capacity-alert',
            name: vDiskInfoKeyset('field_capacity-alert'),
            content: <DiskCapacityAlertLabel value={data.CapacityAlert} />,
            note: CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
        },
        {
            id: 'vdisk-slot-usage',
            name: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage,
            content: formatMetricPercent(data.VDiskSlotUsage, 2),
            note: CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage,
        },
        {
            id: 'vdisk-raw-usage',
            name: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskRawUsage,
            content: formatMetricPercent(data.VDiskRawUsage, 2),
            note: CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage,
        },
    ];
    return items.filter(({id}) => capacityMetricsEnabled || id === 'size');
}

export function getPDiskCapacityItems(
    data: PreparedPDisk,
    {useWhiteboardSize = true}: {useWhiteboardSize?: boolean} = {},
): DiskDetailItem[] {
    const size = useWhiteboardSize ? (data.WhiteboardSize ?? data) : data;
    return [
        {
            id: 'slot-size-in-units',
            name: i18n('field_slot-size-in-units'),
            content: formatCapacityUnitCount(data.SlotSizeInUnits),
            note: CAPACITY_CONFIGURATION_HELP_TEXT.SlotSizeInUnits,
        },
        {
            id: 'space',
            name: i18n('field_space'),
            content: formatStorageMetricPair(size.AllocatedSize, size.TotalSize, 2),
        },
        {
            id: 'capacity-alert',
            name: CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert,
            content: <DiskCapacityAlertLabel value={data.PDiskCapacityAlert} />,
            note: CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
        },
        {
            id: 'pdisk-usage',
            name: CAPACITY_METRICS_COLUMN_TITLES.MaxPDiskUsage,
            content: formatMetricPercent(data.PDiskUsage, 2),
            note: CAPACITY_METRICS_HELP_TEXT.MaxPDiskUsage,
        },
        {
            id: 'slots',
            name: i18n('field_slots'),
            content: formatMetricCountPair(data.NumActiveSlots, data.ExpectedSlotCount),
            note: pDiskInfoKeyset('context_slots'),
        },
    ];
}

export function getStorageGroupCapacityInfoItems(
    data: PreparedStorageGroup | undefined,
): DiskDetailItem[] {
    const capacityAlert = normalizeCapacityAlert(data?.CapacityAlert);
    return [
        {
            id: 'capacity-alert',
            name: CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert,
            content: capacityAlert ? (
                <DiskCapacityAlertLabel value={capacityAlert} />
            ) : (
                EMPTY_DATA_PLACEHOLDER
            ),
            note: CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
        },
        {
            id: 'vdisk-slot-usage',
            name: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage,
            content: formatNormalizedMetricPercent(data?.MaxVDiskSlotUsage),
            note: CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage,
        },
        {
            id: 'vdisk-raw-usage',
            name: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskRawUsage,
            content: formatNormalizedMetricPercent(data?.MaxVDiskRawUsage),
            note: CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage,
        },
    ];
}
