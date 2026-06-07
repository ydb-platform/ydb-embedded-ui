import {CircleExclamationFill, CircleXmarkFill, ClockFill} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';

import {EVDiskState} from '../../types/api/vdisk';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    DISPLAYED_DISK_ERROR_ICON,
    DONOR_ICON,
} from './constants';
import type {PreparedVDisk} from './types';

export type IconCalculator = (
    vDisk: PreparedVDisk,
    severity: number,
    isDonor?: boolean,
) => IconData | undefined;

/**
 * Default icon logic - show icon only for errors and donors
 * This matches current behavior
 */
export function calculateDefaultIcon(
    _vDisk: PreparedVDisk,
    severity: number,
    isDonor?: boolean,
): IconData | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    const isError = severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red;
    if (isError) {
        return DISPLAYED_DISK_ERROR_ICON;
    }

    return undefined;
}

/**
 * State-based icon logic - show specific icons for different states
 * Matches Figma specifications for State mode
 */
export function calculateStateIcon(
    vDisk: PreparedVDisk,
    _severity: number,
    isDonor?: boolean,
): IconData | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    const state = vDisk.VDiskState;

    // Initial states get Clock icon (Figma: "иконка с часиками")
    if (state === EVDiskState.Initial || state === EVDiskState.SyncGuidRecovery) {
        return ClockFill;
    }

    // PDisk error gets CircleExclamation icon (Figma: "иконка с воскклицательным знаком")
    if (state === EVDiskState.PDiskError) {
        return CircleExclamationFill;
    }

    // Other error states get CircleXmark icon (Figma: "иконка - крестик в кружочке")
    if (state === EVDiskState.LocalRecoveryError || state === EVDiskState.SyncGuidRecoveryError) {
        return CircleXmarkFill;
    }

    // OK state and replication - no icon
    return undefined;
}

/**
 * Space-based icon logic - show icons for critical space issues only
 */
export function calculateSpaceIcon(
    _vDisk: PreparedVDisk,
    severity: number,
    isDonor?: boolean,
): IconData | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    // Show icon only for critical space (Red severity)
    const isCritical = severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red;
    if (isCritical) {
        return DISPLAYED_DISK_ERROR_ICON;
    }

    return undefined;
}

/**
 * FrontQueues-based icon logic - show icon for queue problems
 */
export function calculateFrontQueuesIcon(
    _vDisk: PreparedVDisk,
    severity: number,
    isDonor?: boolean,
): IconData | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    // Show icon for Yellow or Red severity
    if (severity >= DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow) {
        return DISPLAYED_DISK_ERROR_ICON;
    }

    return undefined;
}

/**
 * Compaction-based icon logic
 * TODO: Implement when Compaction requirements are defined
 */
export function calculateCompactionIcon(
    _vDisk: PreparedVDisk,
    severity: number,
    isDonor?: boolean,
): IconData | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    // Placeholder: show icon for issues
    if (severity >= DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow) {
        return DISPLAYED_DISK_ERROR_ICON;
    }

    return undefined;
}

/**
 * All mode - complex mode showing multiple indicators
 * For now, uses default icon logic
 * TODO: Implement advanced "All" mode icon logic
 */
export function calculateAllIcon(
    vDisk: PreparedVDisk,
    severity: number,
    isDonor?: boolean,
): IconData | undefined {
    return calculateDefaultIcon(vDisk, severity, isDonor);
}
