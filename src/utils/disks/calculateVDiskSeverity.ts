import {EFlag} from '../../types/api/enums';
import type {EVDiskState} from '../../types/api/vdisk';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    ERROR_SEVERITY,
    VDISK_STATE_SEVERITY,
} from './constants';

export function calculateVDiskSeverity<
    T extends {
        DiskSpace?: EFlag;
        VDiskState?: EVDiskState;
        FrontQueues?: EFlag;
        Replicated?: boolean;
        DonorMode?: boolean;
    },
>(vDisk: T) {
    const {DiskSpace, VDiskState, FrontQueues, Replicated} = vDisk;

    // if the VDisk is not available, we consider that disk has an error severity
    if (!VDiskState) {
        return ERROR_SEVERITY;
    }

    const DiskSpaceSeverity = Math.min(
        DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        getColorSeverity(DiskSpace),
    );
    const VDiskSpaceSeverity = getStateSeverity(VDiskState);
    const FrontQueuesSeverity = Math.min(
        DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        getColorSeverity(FrontQueues),
    );

    let severity = Math.max(DiskSpaceSeverity, VDiskSpaceSeverity, FrontQueuesSeverity);

    // donors are always in the not replicated state since they are leftovers
    if (Replicated === false && severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green) {
        severity = DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue;
    }

    return severity;
}

export function getStateSeverity(vDiskState?: EVDiskState) {
    // if the VDiskState if undefined, we consider that this VDisk has an error
    if (!vDiskState) {
        return ERROR_SEVERITY;
    }

    return VDISK_STATE_SEVERITY[vDiskState] ?? ERROR_SEVERITY;
}

function getColorSeverity(color?: EFlag) {
    if (!color) {
        return ERROR_SEVERITY;
    }

    // Blue is reserved for not replicated VDisks. DarkGrey is reserved for donors.
    if (color === EFlag.Blue) {
        return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green;
    }

    return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY[color] ?? ERROR_SEVERITY;
}
