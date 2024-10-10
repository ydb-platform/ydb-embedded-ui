import type {EFlag} from '../../types/api/enums';
import type {EVDiskState, TVDiskStateInfo} from '../../types/api/vdisk';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    NOT_AVAILABLE_SEVERITY,
    VDISK_STATE_SEVERITY,
} from './constants';
import {isFullVDiskData} from './helpers';

export function calculateVDiskSeverity(vDisk: TVDiskStateInfo) {
    if (!isFullVDiskData(vDisk)) {
        return NOT_AVAILABLE_SEVERITY;
    }

    const {DiskSpace, VDiskState, FrontQueues, Replicated} = vDisk;

    // if the disk is not available, this determines its status severity regardless of other features
    if (!VDiskState) {
        return NOT_AVAILABLE_SEVERITY;
    }

    const DiskSpaceSeverity = getColorSeverity(DiskSpace);
    const VDiskSpaceSeverity = getStateSeverity(VDiskState);
    const FrontQueuesSeverity = Math.min(
        DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Orange,
        getColorSeverity(FrontQueues),
    );

    let severity = Math.max(DiskSpaceSeverity, VDiskSpaceSeverity, FrontQueuesSeverity);

    // donors are always in the not replicated state since they are leftovers
    if (!Replicated && severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green) {
        severity = DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue;
    }

    return severity;
}

function getStateSeverity(vDiskState?: EVDiskState) {
    if (!vDiskState) {
        return NOT_AVAILABLE_SEVERITY;
    }

    return VDISK_STATE_SEVERITY[vDiskState] ?? NOT_AVAILABLE_SEVERITY;
}

function getColorSeverity(color?: EFlag) {
    if (!color) {
        return NOT_AVAILABLE_SEVERITY;
    }

    return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY[color] ?? NOT_AVAILABLE_SEVERITY;
}
