import {ECapacityAlert, EFlag, isCapacityAlert} from '../../types/api/enums';

import {
    COMPACTION_SEVERITY,
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    FRONT_QUEUES_SEVERITY,
    NOT_AVAILABLE_SEVERITY,
    SPACE_SEVERITY,
    VDISK_STATE_SEVERITY_FOR_STATE_MODE,
} from './constants';
import type {DisplaySeverity, PreparedVDisk} from './types';

export type SeverityCalculator = (vDisk: PreparedVDisk) => DisplaySeverity;

/**
 * Calculate severity based only on VDiskState
 * Used in State grouping mode
 * Uses special mapping where Initial=Yellow and Error=SolidRed
 * Replicating disks (Replicated=false) remain Blue regardless of state
 */
export function calculateStateSeverity(vDisk: PreparedVDisk): DisplaySeverity {
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
 * Maps capacityAlert to detailed severity levels for visual differentiation
 */
export function calculateSpaceSeverity(vDisk: PreparedVDisk): DisplaySeverity {
    // In Space mode, CapacityAlert is the primary indicator
    // If CapacityAlert is not available, show N/A (NOT_AVAILABLE_SEVERITY)
    if (!vDisk.CapacityAlert || !isCapacityAlert(vDisk.CapacityAlert)) {
        return NOT_AVAILABLE_SEVERITY;
    }

    // Use detailed capacityAlert mapping
    const alert = vDisk.CapacityAlert;
    switch (alert) {
        case ECapacityAlert.GREEN:
            return SPACE_SEVERITY.GREEN;
        case ECapacityAlert.CYAN:
            return SPACE_SEVERITY.CYAN;
        case ECapacityAlert.LIGHTYELLOW:
            return SPACE_SEVERITY.LIGHT_YELLOW;
        case ECapacityAlert.YELLOW:
            return SPACE_SEVERITY.YELLOW;
        case ECapacityAlert.LIGHTORANGE:
            return SPACE_SEVERITY.LIGHT_ORANGE;
        case ECapacityAlert.PREORANGE:
            return SPACE_SEVERITY.PRE_ORANGE;
        case ECapacityAlert.ORANGE:
            return SPACE_SEVERITY.ORANGE;
        case ECapacityAlert.RED:
            return SPACE_SEVERITY.RED;
        case ECapacityAlert.BLACK:
            return SPACE_SEVERITY.BLACK;
        default:
            return NOT_AVAILABLE_SEVERITY;
    }
}

/**
 * Calculate severity based only on front queues
 * Used in FrontQueues grouping mode
 * Maps FrontQueues flag to detailed severity levels:
 * - Grey -> N/A (NOT_AVAILABLE_SEVERITY)
 * - Green -> OK (FRONT_QUEUES_SEVERITY.OK)
 * - Blue -> ??? (treated as Green/OK)
 * - Yellow -> Notice (FRONT_QUEUES_SEVERITY.NOTICE)
 * - Orange -> Warning (FRONT_QUEUES_SEVERITY.WARNING)
 * - Red -> Impaired (FRONT_QUEUES_SEVERITY.IMPAIRED)
 *
 * Note: Unlike Space mode, replicating disks (Replicated=false) do NOT get Blue color.
 * Instead, they show striped pattern with their actual severity color (handled in CSS).
 */
export function calculateFrontQueuesSeverity(vDisk: PreparedVDisk): DisplaySeverity {
    const frontQueues = vDisk.FrontQueues;

    if (!frontQueues) {
        return NOT_AVAILABLE_SEVERITY;
    }

    switch (frontQueues) {
        case EFlag.Grey:
            return NOT_AVAILABLE_SEVERITY;
        case EFlag.Green:
        case EFlag.Blue: // Blue is treated as OK in FrontQueues context
            return FRONT_QUEUES_SEVERITY.OK;
        case EFlag.Yellow:
            return FRONT_QUEUES_SEVERITY.NOTICE;
        case EFlag.Orange:
            return FRONT_QUEUES_SEVERITY.WARNING;
        case EFlag.Red:
            return FRONT_QUEUES_SEVERITY.IMPAIRED;
        default:
            return NOT_AVAILABLE_SEVERITY;
    }
}

/**
 * Calculate severity based on compaction status (Fresh/Level rank satisfaction)
 * Used in Compaction grouping mode
 *
 * Border color is determined by the worst of Fresh or Level rank:
 * - Both Green -> Green border (OK)
 * - At least one Yellow -> Yellow border (NOTICE)
 * - At least one Orange or Red -> Red border (WARNING)
 */
export function calculateCompactionSeverity(vDisk: PreparedVDisk): DisplaySeverity {
    const freshFlag = vDisk.SatisfactionRank?.FreshRank?.Flag;
    const levelFlag = vDisk.SatisfactionRank?.LevelRank?.Flag;

    // If no data available, return N/A
    if (!freshFlag && !levelFlag) {
        return NOT_AVAILABLE_SEVERITY;
    }

    // Determine worst severity between Fresh and Level
    const freshSeverity = freshFlag
        ? DISK_COLOR_STATE_TO_NUMERIC_SEVERITY[freshFlag]
        : DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green;
    const levelSeverity = levelFlag
        ? DISK_COLOR_STATE_TO_NUMERIC_SEVERITY[levelFlag]
        : DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green;

    const worstSeverity = Math.max(freshSeverity, levelSeverity);

    // Map to compaction severity levels
    // Orange (4) and Red (5) both map to WARNING (red border)
    if (worstSeverity >= DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Orange) {
        return COMPACTION_SEVERITY.WARNING; // Red border
    }
    if (worstSeverity >= DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow) {
        return COMPACTION_SEVERITY.NOTICE; // Yellow border
    }
    return COMPACTION_SEVERITY.OK; // Green border
}

/**
 * Calculate combined severity for "All" grouping mode
 * This is a complex mode that will show multiple indicators simultaneously
 * Uses the pre-calculated Severity field which combines all factors
 * TODO: Implement advanced "All" mode visualization
 */
export function calculateAllSeverity(vDisk: PreparedVDisk): DisplaySeverity {
    return (vDisk.Severity ?? NOT_AVAILABLE_SEVERITY) as DisplaySeverity;
}
