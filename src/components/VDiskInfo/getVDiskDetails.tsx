import {isNil} from 'lodash';

import type {NodeMetadata} from '../../types/store/nodesList';
import {isFullVDiskData} from '../../utils/disks/helpers';
import type {PreparedVDisk, UnavailableDonor} from '../../utils/disks/types';
import {formatMetricPercent, formatStorageMetricPair} from '../../utils/storageMetrics';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';
import {VDiskCapacityAlertLabel} from '../VDiskStatus';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {
    CAPACITY_CONFIGURATION_HELP_TEXT,
    CAPACITY_METRICS_COLUMN_TITLES,
    CAPACITY_METRICS_HELP_TEXT,
} from '../capacityMetricsColumns/constants';
import {formatCapacityUnitCount} from '../capacityMetricsColumns/formatters';

import {vDiskInfoKeyset as i18n} from './i18n';

export interface VDiskDetailItem extends YDBDefinitionListItem {
    /** Stable field identifier for ordering and grouping independently of translated names. */
    id: string;
}

export function getVDiskLocationItems(
    data: PreparedVDisk | UnavailableDonor,
    nodeData: NodeMetadata,
): VDiskDetailItem[] {
    const fullData = isFullVDiskData(data) ? data : undefined;
    const slotId = isFullVDiskData(data) ? data.VDiskSlotId : data.VSlotId;
    const entries = [
        {id: 'fqdn', name: i18n('field_fqdn'), value: nodeData.Host},
        {id: 'rack', name: i18n('field_rack'), value: nodeData.Rack},
        {id: 'datacenter', name: i18n('field_datacenter'), value: nodeData.DC},
        {
            id: 'pdisk-path',
            name: i18n('field_pdisk-path'),
            value: fullData?.PDiskPath ?? fullData?.PDisk?.Path,
        },
        {id: 'node-id', name: i18n('field_node-id'), value: data.NodeId},
        {id: 'pdisk-id', name: i18n('field_pdisk-id'), value: data.PDiskId},
        {id: 'vdisk-slot-id', name: i18n('field_vdisk-slot-id'), value: slotId},
    ];

    return entries.flatMap(({id, name, value}) =>
        isNil(value) || value === '' ? [] : [{id, name, content: value, copyText: value}],
    );
}

export function getVDiskCapacityItems(
    data: PreparedVDisk,
    {useWhiteboardSize}: {useWhiteboardSize: boolean},
): VDiskDetailItem[] {
    const items: VDiskDetailItem[] = [];
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
            content: formatStorageMetricPair(size.AllocatedSize, size.SizeLimit),
        });
    }
    items.push({
        id: 'capacity-alert',
        name: i18n('field_capacity-alert'),
        content: <VDiskCapacityAlertLabel value={data.CapacityAlert} />,
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
            items.push({id, name, content: formatMetricPercent(value), note});
        }
    }
    return items;
}
