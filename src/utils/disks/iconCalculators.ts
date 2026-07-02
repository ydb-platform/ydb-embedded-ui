import {
    CircleCheckFill,
    CircleExclamationFill,
    CircleQuestionFill,
    CircleXmarkFill,
    ClockFill,
    Dots9,
    Ellipsis,
    GripHorizontal,
    TriangleExclamationFill,
} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';

import {ECapacityAlert, EFlag, isCapacityAlert} from '../../types/api/enums';
import {EVDiskState} from '../../types/api/vdisk';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    DISPLAYED_DISK_ERROR_ICON,
    DONOR_ICON,
    FRONT_QUEUES_SEVERITY,
    NOT_AVAILABLE_SEVERITY,
    SPACE_SEVERITY,
} from './constants';
import type {PreparedVDisk} from './types';

export interface IconWithColor {
    icon: IconData;
    color?: string;
}

export type IconCalculator = (
    vDisk: PreparedVDisk,
    severity: number,
    isDonor?: boolean,
) => IconData | IconWithColor[] | string | undefined;

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
 * Space-based icon logic - show text labels for capacityAlert levels
 * Returns text labels (e.g., "G", "C", "LY") instead of icons
 */
// eslint-disable-next-line complexity
export function calculateSpaceIcon(
    vDisk: PreparedVDisk,
    severity: number,
    isDonor?: boolean,
): IconData | string | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    // Map severity to text label based on capacityAlert
    if (vDisk.CapacityAlert && isCapacityAlert(vDisk.CapacityAlert)) {
        const alert = vDisk.CapacityAlert as ECapacityAlert;
        switch (alert) {
            case ECapacityAlert.GREEN:
                return 'G';
            case ECapacityAlert.CYAN:
                return 'C';
            case ECapacityAlert.LIGHTYELLOW:
                return 'LY';
            case ECapacityAlert.YELLOW:
                return 'Y';
            case ECapacityAlert.LIGHTORANGE:
                return 'LO';
            case ECapacityAlert.PREORANGE:
                return 'PO';
            case ECapacityAlert.ORANGE:
                return 'O';
            case ECapacityAlert.RED:
                return 'R';
            case ECapacityAlert.BLACK:
                return 'B';
        }
    }

    // Fallback: map severity to text label
    if (severity === SPACE_SEVERITY.GREEN) {
        return 'G';
    }
    if (severity === SPACE_SEVERITY.CYAN) {
        return 'C';
    }
    if (severity === SPACE_SEVERITY.LIGHT_YELLOW) {
        return 'LY';
    }
    if (severity === SPACE_SEVERITY.YELLOW) {
        return 'Y';
    }
    if (severity === SPACE_SEVERITY.LIGHT_ORANGE) {
        return 'LO';
    }
    if (severity === SPACE_SEVERITY.PRE_ORANGE) {
        return 'PO';
    }
    if (severity === SPACE_SEVERITY.ORANGE) {
        return 'O';
    }
    if (severity === SPACE_SEVERITY.RED) {
        return 'R';
    }
    if (severity === SPACE_SEVERITY.BLACK) {
        return 'B';
    }

    if (severity === NOT_AVAILABLE_SEVERITY) {
        return CircleQuestionFill;
    }

    return undefined;
}

/**
 * FrontQueues-based icon logic - show icons based on queue status
 * Matches FrontQueuesLegend icons:
 * - OK (Green): no icon
 * - Notice (Yellow): Ellipsis icon
 * - Warning (Orange): GripHorizontal icon
 * - Impaired (Red): Dots9 icon
 */
export function calculateFrontQueuesIcon(
    _vDisk: PreparedVDisk,
    severity: number,
    isDonor?: boolean,
): IconData | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    // Map severity to icon based on FrontQueues status
    if (severity === FRONT_QUEUES_SEVERITY.NOTICE) {
        return Ellipsis;
    }

    if (severity === FRONT_QUEUES_SEVERITY.WARNING) {
        return GripHorizontal;
    }

    if (severity === FRONT_QUEUES_SEVERITY.IMPAIRED) {
        return Dots9;
    }

    if (severity === NOT_AVAILABLE_SEVERITY) {
        return CircleQuestionFill;
    }

    // OK status and replication - no icon
    return undefined;
}

/**
 * Get icon and color for a single compaction rank (Fresh or Level)
 * Maps EFlag to corresponding icon and color from CompactionLegend
 */
function getCompactionRankIconWithColor(flag: EFlag | undefined): IconWithColor | undefined {
    if (!flag) {
        return {
            icon: CircleQuestionFill,
            color: 'rgba(162, 162, 162, 1)',
        };
    }

    switch (flag) {
        case EFlag.Green:
            return {
                icon: CircleCheckFill,
                color: 'var(--g-color-text-positive)',
            };
        case EFlag.Yellow:
            return {
                icon: TriangleExclamationFill,
                color: 'var(--g-color-text-warning)',
            };
        case EFlag.Orange:
            return {
                icon: CircleExclamationFill,
                color: 'var(--g-color-text-danger)',
            };
        case EFlag.Red:
            return {
                icon: CircleXmarkFill,
                color: 'var(--g-color-text-primary)',
            };
        default:
            return undefined;
    }
}

/**
 * Compaction-based icon logic - shows two icons (Fresh + Level) side by side
 * Each icon has its own color based on its rank
 * Icons are only shown if at least one rank is not green
 * Returns an array of icons with colors: [FreshIcon, LevelIcon]
 *
 * Icon mapping from CompactionLegend:
 * - Green: CircleCheckFill (text-positive)
 * - Yellow: TriangleExclamationFill (text-warning)
 * - Orange: CircleExclamationFill (text-danger)
 * - Red: CircleXmarkFill (text-primary)
 * - Missing: CircleQuestionFill (rgba(162, 162, 162, 1))
 */
export function calculateCompactionIcon(
    vDisk: PreparedVDisk,
    _severity: number,
    isDonor?: boolean,
): IconData | IconWithColor[] | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    const freshFlag = vDisk.SatisfactionRank?.FreshRank?.Flag;
    const levelFlag = vDisk.SatisfactionRank?.LevelRank?.Flag;

    // If both ranks are green, no icon
    if (freshFlag === EFlag.Green && levelFlag === EFlag.Green) {
        return undefined;
    }

    // At least one rank is missing or not green - show both icons with their respective colors
    const freshIconWithColor = getCompactionRankIconWithColor(freshFlag);
    const levelIconWithColor = getCompactionRankIconWithColor(levelFlag);

    // Return array of icons with colors [Fresh, Level]
    const icons: IconWithColor[] = [];
    if (freshIconWithColor) {
        icons.push(freshIconWithColor);
    }
    if (levelIconWithColor) {
        icons.push(levelIconWithColor);
    }

    return icons.length > 0 ? icons : undefined;
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
