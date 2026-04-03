import {EFlag} from '../../types/api/enums';
import type {EVDiskState} from '../../types/api/vdisk';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    NOT_AVAILABLE_SEVERITY,
    VDISK_STATE_SEVERITY,
} from './constants';

export function calculateVDiskSeverity<
    T extends {
        DiskSpace?: EFlag;
        VDiskState?: EVDiskState;
        FrontQueues?: EFlag;
        Replicated?: boolean;
    },
>(vDisk: T) {
    const {DiskSpace, VDiskState, FrontQueues, Replicated} = vDisk;

    // if the VDisk is not available, we display it as not available
    if (!VDiskState) {
        return NOT_AVAILABLE_SEVERITY;
    }

    const DiskSpaceSeverity = Math.min(
        DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        getColorSeverity(DiskSpace),
    );
    const VDiskStateSeverity = getStateSeverity(VDiskState);
    const FrontQueuesSeverity = Math.min(
        DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        getColorSeverity(FrontQueues),
    );

    let severity = Math.max(DiskSpaceSeverity, VDiskStateSeverity, FrontQueuesSeverity);

    // donors are always in the not replicated state since they are leftovers
    if (Replicated === false && severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green) {
        severity = DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue;
    }

    return severity;
}

export function getStateSeverity(vDiskState?: EVDiskState) {
    // if the VDiskState if undefined, we display it as not available
    if (!vDiskState) {
        return NOT_AVAILABLE_SEVERITY;
    }

    // If some strange value arrives that isn't in the map,
    // we consider it "not available" and color it gray
    return VDISK_STATE_SEVERITY[vDiskState] ?? NOT_AVAILABLE_SEVERITY;
}

function getColorSeverity(color?: EFlag) {
    if (!color) {
        return NOT_AVAILABLE_SEVERITY;
    }

    // Blue is reserved for not replicated VDisks. DarkGrey is reserved for donors.
    if (color === EFlag.Blue) {
        return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green;
    }

    return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY[color] ?? NOT_AVAILABLE_SEVERITY;
}
