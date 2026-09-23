import {formatBytes} from '../../utils/bytesParsers';
import type {PreparedPDisk} from '../../utils/disks/types';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';
import {getPDiskCapacityInfoItems} from '../DiskCapacityInfo/DiskCapacityInfo';
import type {DiskDetailItem} from '../DiskInfo/getDiskLocationItems';
import {DiskCapacityAlertLabel, DiskFlagLabel} from '../DiskStatus/DiskStatus';

import {PDiskLogSize} from './PDiskLogSize';
import {pDiskInfoKeyset as i18n} from './i18n';

export function getPDiskRuntimeItems(data: PreparedPDisk): DiskDetailItem[] {
    return [
        {id: 'device', name: i18n('device'), content: <DiskFlagLabel flag={data.Device} />},
        {id: 'realtime', name: i18n('realtime'), content: <DiskFlagLabel flag={data.Realtime} />},
    ];
}

export function getPDiskCapacityItems(
    data: PreparedPDisk,
    {useWhiteboardSize}: {useWhiteboardSize: boolean},
): DiskDetailItem[] {
    const size = useWhiteboardSize ? (data.WhiteboardSize ?? data) : data;
    const available = (value: unknown) => parseOptionalNonNegativeNumber(value) !== undefined;
    const fields = [
        {id: 'slot-size-in-units', visible: available(data.SlotSizeInUnits)},
        {id: 'space', visible: available(size.AllocatedSize) || available(size.TotalSize)},
        {id: 'capacity-alert', visible: true},
        {id: 'pdisk-usage', visible: available(data.PDiskUsage)},
        {id: 'slots', visible: available(data.NumActiveSlots) || available(data.ExpectedSlotCount)},
    ];
    const capacityItems = getPDiskCapacityInfoItems(
        useWhiteboardSize ? data : {...data, WhiteboardSize: undefined},
        {withUsage: true, withCapacityAlert: true, fixedDecimalPlaces: 2},
    );
    const items: DiskDetailItem[] = [];
    for (const {id, visible} of fields) {
        const field = visible ? capacityItems.find((item) => item.id === id) : undefined;
        if (field) {
            items.push({
                id,
                name: field.title,
                content:
                    id === 'capacity-alert' ? (
                        <DiskCapacityAlertLabel value={data.PDiskCapacityAlert} />
                    ) : (
                        field.value
                    ),
                note: id === 'slots' ? i18n('context_slots') : field.note,
            });
        }
    }
    if (available(data.LogUsedSize) || available(data.LogTotalSize)) {
        items.push({
            id: 'log-size',
            name: i18n('log-size'),
            content: <PDiskLogSize used={data.LogUsedSize} total={data.LogTotalSize} />,
            note: i18n('context_log-size'),
        });
    }
    if (available(data.SystemSize)) {
        items.push({
            id: 'system-size',
            name: i18n('system-size'),
            content: formatBytes({value: data.SystemSize, fixedDecimalPlaces: 2}),
            note: i18n('context_system-size'),
        });
    }
    return items;
}
