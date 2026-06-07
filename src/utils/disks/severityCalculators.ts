import {EFlag, isCapacityAlert} from '../../types/api/enums';
import {getCapacityAlertSeverity} from '../capacityAlerts';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    NOT_AVAILABLE_SEVERITY,
    VDISK_STATE_SEVERITY_FOR_STATE_MODE,
} from './constants';
import {getColorSeverity} from './helpers';
import type {PreparedVDisk} from './types';

export type SeverityCalculator = (vDisk: PreparedVDisk) => number;

/**
 * Calculate severity based only on VDiskState
 * Used in State grouping mode
 * Uses special mapping where Initial=Yellow and Error=SolidRed
 * Replicating disks (Replicated=false) remain Blue regardless of state
 */
export function calculateStateSeverity(vDisk: PreparedVDisk): number {
    const vDiskState = vDisk.VDiskState;

    if (!vDiskState) {
        return NOT_AVAILABLE_SEVERITY;
    }

    const stateSeverity = VDISK_STATE_SEVERITY_FOR_STATE_MODE[vDiskState] ?? NOT_AVAILABLE_SEVERITY;

    // Replicating disks (not replicated yet) should be Blue, even if state is OK
    if (
        vDisk.Replicated === false &&
        stateSeverity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green
    ) {
        return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue;
    }

    return stateSeverity;
}

/**
 * Calculate severity based only on disk space usage
 * Used in Space grouping mode
 */
export function calculateSpaceSeverity(vDisk: PreparedVDisk): number {
    if (vDisk.CapacityAlert && isCapacityAlert(vDisk.CapacityAlert)) {
        return getCapacityAlertSeverity(vDisk.CapacityAlert);
    }

    const diskSpace = vDisk.DiskSpace;
    if (!diskSpace) {
        return NOT_AVAILABLE_SEVERITY;
    }

    // DiskSpace Orange and Red indicate critical issues
    if (diskSpace === EFlag.Orange || diskSpace === EFlag.Red) {
        return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red;
    }

    return Math.min(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow, getColorSeverity(diskSpace));
}

/**
 * Calculate severity based only on front queues
 * Used in FrontQueues grouping mode
 */
export function calculateFrontQueuesSeverity(vDisk: PreparedVDisk): number {
    const frontQueues = vDisk.FrontQueues;
    if (!frontQueues) {
        return NOT_AVAILABLE_SEVERITY;
    }

    return Math.min(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow, getColorSeverity(frontQueues));
}

/**
 * Calculate severity based on compaction status
 * Used in Compaction grouping mode
 * TODO: Implement when Compaction field is added to PreparedVDisk
 */
export function calculateCompactionSeverity(_vDisk: PreparedVDisk): number {
    // Placeholder: return NOT_AVAILABLE until Compaction field is available
    return NOT_AVAILABLE_SEVERITY;
}

/**
 * Calculate combined severity for "All" grouping mode
 * This is a complex mode that will show multiple indicators simultaneously
 * Uses the pre-calculated Severity field which combines all factors
 * TODO: Implement advanced "All" mode visualization
 */
export function calculateAllSeverity(vDisk: PreparedVDisk): number {
    return vDisk.Severity ?? NOT_AVAILABLE_SEVERITY;
}
