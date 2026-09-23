import {isNil} from 'lodash';

import type {NodeMetadata} from '../../types/store/nodesList';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import type {DiskDetailItem} from '../../utils/disks/diskInfo/getDiskLocationItems';
import {getDiskLocationItems} from '../../utils/disks/diskInfo/getDiskLocationItems';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {formatMetricPercent, formatStorageMetricPair} from '../../utils/storageMetrics';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';
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
        {withVDiskSlotId: true},
    );
}

export function getVDiskIdentityItems(data: PreparedVDisk = {}): DiskDetailItem[] {
    const entries = [
        {id: 'kind', name: i18n('kind'), value: data.Kind},
        {id: 'guid', name: i18n('guid'), value: data.Guid},
        {id: 'incarnation-guid', name: i18n('incarnation-guid'), value: data.IncarnationGuid},
        {id: 'instance-guid', name: i18n('instance-guid'), value: data.InstanceGuid},
    ];
    return entries.flatMap(({id, name, value}) =>
        isNil(value) || value === '' ? [] : [{id, name, content: value}],
    );
}

export function getVDiskCapacityItems(
    data: PreparedVDisk,
    {capacityMetricsEnabled}: {capacityMetricsEnabled: boolean},
): DiskDetailItem[] {
    const size = capacityMetricsEnabled ? (data.WhiteboardSize ?? data) : data;
    const items: DiskDetailItem[] = [
        {
            id: 'group-size-in-units',
            name: i18n('field_group-size-in-units'),
            content: formatCapacityUnitCount(data.GroupSizeInUnits),
            note: CAPACITY_CONFIGURATION_HELP_TEXT.GroupSizeInUnits,
        },
        {
            id: 'size',
            name: i18n('size'),
            content: formatStorageMetricPair(size.AllocatedSize, size.SizeLimit, 2),
        },
        {
            id: 'capacity-alert',
            name: i18n('field_capacity-alert'),
            content: (
                <DiskCapacityAlertLabel
                    value={data.CapacityAlert}
                    emptyText={EMPTY_DATA_PLACEHOLDER}
                />
            ),
            note: CAPACITY_METRICS_HELP_TEXT.CapacityAlert,
        },
        {
            id: 'vdisk-slot-usage',
            name: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage,
            content: formatMetricPercent(data.VDiskSlotUsage, 2),
            note: CAPACITY_METRICS_HELP_TEXT.MaxVDiskSlotUsage,
        },
    ];
    if (parseOptionalNonNegativeNumber(data.VDiskRawUsage) !== undefined) {
        items.push({
            id: 'vdisk-raw-usage',
            name: CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskRawUsage,
            content: formatMetricPercent(data.VDiskRawUsage, 2),
            note: CAPACITY_METRICS_HELP_TEXT.MaxVDiskRawUsage,
        });
    }
    return items.filter(
        ({id}) =>
            capacityMetricsEnabled ||
            (id === 'size' &&
                (parseOptionalNonNegativeNumber(size.AllocatedSize) !== undefined ||
                    parseOptionalNonNegativeNumber(size.SizeLimit) !== undefined)),
    );
}
