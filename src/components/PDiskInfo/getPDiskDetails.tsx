import {formatBytes} from '../../utils/bytesParsers';
import type {DiskDetailItem} from '../../utils/disks/diskInfo/getDiskLocationItems';
import type {PreparedPDisk} from '../../utils/disks/types';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';
import {DiskFlagLabel} from '../DiskStatus/DiskStatus';

import {PDiskLogSize} from './PDiskLogSize';
import {pDiskInfoKeyset as i18n} from './i18n';

export function getPDiskRuntimeItems(data: PreparedPDisk): DiskDetailItem[] {
    return [
        {id: 'device', name: i18n('device'), content: <DiskFlagLabel flag={data.Device} />},
        {id: 'realtime', name: i18n('realtime'), content: <DiskFlagLabel flag={data.Realtime} />},
    ];
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
