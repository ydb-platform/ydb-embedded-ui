import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';

import {DISK_NUMERIC_SEVERITY_TO_STATE_COLOR, NOT_AVAILABLE_SEVERITY_COLOR} from './constants';

export function isFullVDiskData(disk: TVDiskStateInfo | TVSlotId): disk is TVDiskStateInfo {
    return 'VDiskId' in disk;
}

export function getSeverityColor(severity: number | undefined) {
    if (severity === undefined) {
        return NOT_AVAILABLE_SEVERITY_COLOR;
    }

    return DISK_NUMERIC_SEVERITY_TO_STATE_COLOR[severity] || NOT_AVAILABLE_SEVERITY_COLOR;
}
