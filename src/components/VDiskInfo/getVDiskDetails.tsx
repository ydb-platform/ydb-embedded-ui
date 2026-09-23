import type {NodeMetadata} from '../../types/store/nodesList';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {formatMetricPercent, formatStorageMetricPair} from '../../utils/storageMetrics';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';
import type {DiskDetailItem} from '../DiskInfo/getDiskLocationItems';
import {getDiskLocationItems} from '../DiskInfo/getDiskLocationItems';
import {DiskCapacityAlertLabel} from '../DiskStatus/DiskStatus';
import {
    CAPACITY_CONFIGURATION_HELP_TEXT,
    CAPACITY_METRICS_COLUMN_TITLES,
    CAPACITY_METRICS_HELP_TEXT,
} from '../capacityMetricsColumns/constants';
import {formatCapacityUnitCount} from '../capacityMetricsColumns/formatters';

import {vDiskInfoKeyset as i18n} from './i18n';

export function getVDiskLocationItems(
    data: PreparedVDisk | UnavailableDonor,
    nodeData: NodeMetadata,
): DiskDetailItem[] {
    const fullData = isFullVDiskData(data) ? data : undefined;
    return getDiskLocationItems(
        {
            NodeId: data.NodeId,
            PDiskId: data.PDiskId,
            Path: fullData?.PDiskPath ?? fullData?.PDisk?.Path,
            VDiskSlotId: isFullVDiskData(data) ? data.VDiskSlotId : data.VSlotId,
        },
        nodeData,
    );
}

export function getVDiskCapacityItems(
    data: PreparedVDisk,
    {useWhiteboardSize}: {useWhiteboardSize: boolean},
): DiskDetailItem[] {
    const items: DiskDetailItem[] = [];
    if (parseOptionalNonNegativeNumber(data.GroupSizeInUnits) !== undefined) {
        items.push({
            id: 'group-size-in-units',
            name: i18n('field_group-size-in-units'),
            content: formatCapacityUnitCount(data.GroupSizeInUnits),
            note: CAPACITY_CONFIGURATION_HELP_TEXT.GroupSizeInUnits,
        });
    }
    const size = useWhiteboardSize ? (data.WhiteboardSize ?? data) : data;
    if (
        parseOptionalNonNegativeNumber(size.AllocatedSize) !== undefined ||
        parseOptionalNonNegativeNumber(size.SizeLimit) !== undefined
    ) {
        items.push({
            id: 'size',
            name: i18n('size'),
            content: formatStorageMetricPair(size.AllocatedSize, size.SizeLimit, 2),
        });
    }
    items.push({
        id: 'capacity-alert',
        name: i18n('field_capacity-alert'),
        content: <DiskCapacityAlertLabel value={data.CapacityAlert} />,
        note: CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
    });
    for (const [id, name, value, note] of [
        [
            'vdisk-slot-usage',
            CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage,
            data.VDiskSlotUsage,
            CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage,
        ],
        [
            'vdisk-raw-usage',
            CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskRawUsage,
            data.VDiskRawUsage,
            CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage,
        ],
    ] as const) {
        if (parseOptionalNonNegativeNumber(value) !== undefined) {
            items.push({id, name, content: formatMetricPercent(value, 2), note});
        }
    }
    return items;
}
