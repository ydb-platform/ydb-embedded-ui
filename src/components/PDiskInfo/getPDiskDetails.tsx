import {formatBytes} from '../../utils/bytesParsers';
import type {DiskDetailItem} from '../../utils/disks/diskInfo/getDiskLocationItems';
import type {PreparedPDisk} from '../../utils/disks/types';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';
import {getPDiskCapacityInfoItems} from '../DiskCapacityInfo/DiskCapacityInfo';
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
    {useWhiteboardSize = true}: {useWhiteboardSize?: boolean} = {},
): DiskDetailItem[] {
    const fieldOrder = ['slot-size-in-units', 'space', 'capacity-alert', 'pdisk-usage', 'slots'];
    const capacityItems = getPDiskCapacityInfoItems(data, {
        withUsage: true,
        withCapacityAlert: true,
        fixedDecimalPlaces: 2,
        useWhiteboardSize,
    });
    const items: DiskDetailItem[] = [];
    for (const id of fieldOrder) {
        const field = capacityItems.find((item) => item.id === id);
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
    return items;
}

export function getPDiskLogItems(data: PreparedPDisk): DiskDetailItem[] {
    const items: DiskDetailItem[] = [];
    const available = (value: unknown) => parseOptionalNonNegativeNumber(value) !== undefined;
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
