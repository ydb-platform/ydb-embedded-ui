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
        DonorMode?: boolean;
    },
>(vDisk: T) {
    const {DiskSpace, VDiskState, FrontQueues, Replicated, DonorMode} = vDisk;

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

    const isHealthy = severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green;

    // If VDisk is healthy and not replicated, adjust color based on its role
    if (isHealthy && Replicated === false) {
        severity = DonorMode
            ? DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.DarkGrey // donor
            : DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue; // replicating
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

    // Blue is reserved for not replicated VDisks. DarkGrey is reserved for donors.
    if (color === EFlag.Blue || color === EFlag.DarkGrey) {
        return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green;
    }

    return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY[color] ?? NOT_AVAILABLE_SEVERITY;
}
