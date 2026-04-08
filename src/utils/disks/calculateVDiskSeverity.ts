import {EFlag, isCapacityAlert} from '../../types/api/enums';
import type {EVDiskState} from '../../types/api/vdisk';
import {getCapacityAlertSeverity} from '../capacityAlerts';

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
        CapacityAlert?: string;
    },
>(vDisk: T) {
    const {DiskSpace, VDiskState, FrontQueues, Replicated, CapacityAlert} = vDisk;

    // if the VDisk is not available, we display it as not available
    if (!VDiskState) {
        return NOT_AVAILABLE_SEVERITY;
    }

    const VDiskStateSeverity = getStateSeverity(VDiskState);
    const VDiskSpaceSeverity =
        CapacityAlert && isCapacityAlert(CapacityAlert)
            ? getCapacityAlertSeverity(CapacityAlert)
            : getDiskSpaceSeverity(DiskSpace);
    const FrontQueuesSeverity = Math.min(
        DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        getColorSeverity(FrontQueues),
    );

    let severity = Math.max(VDiskStateSeverity, VDiskSpaceSeverity, FrontQueuesSeverity);

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

function getDiskSpaceSeverity(diskSpace?: EFlag) {
    const colorSeverity = getColorSeverity(diskSpace);

    // DiskSpace Orange and Red indicate critical disk space issues and should be displayed as Red
    if (diskSpace === EFlag.Orange || diskSpace === EFlag.Red) {
        return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red;
    }

    return Math.min(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow, colorSeverity);
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
