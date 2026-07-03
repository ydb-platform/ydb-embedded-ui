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
} from './constants';
import type {PreparedVDisk} from './types';

export interface IconWithColor {
    icon: IconData;
    color?: string;
}

export type IconCalculator = (
    vDisk: PreparedVDisk,
    isDonor?: boolean,
) => IconData | IconWithColor[] | string | undefined;

/**
 * Default icon logic - show icon only for errors and donors
 * This matches current behavior
 */
export function calculateDefaultIcon(
    vDisk: PreparedVDisk,
    isDonor?: boolean,
): IconData | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    const isError = vDisk.Severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red;
    if (isError) {
        return DISPLAYED_DISK_ERROR_ICON;
    }

    return undefined;
}

/**
 * State-based icon logic - show specific icons for different states
 * Matches Figma specifications for State mode
 */
export function calculateStateIcon(vDisk: PreparedVDisk, isDonor?: boolean): IconData | undefined {
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
export function calculateSpaceIcon(
    vDisk: PreparedVDisk,
    isDonor?: boolean,
): IconData | string | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    if (!vDisk.CapacityAlert || !isCapacityAlert(vDisk.CapacityAlert)) {
        return CircleQuestionFill;
    }

    switch (vDisk.CapacityAlert) {
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
    vDisk: PreparedVDisk,
    isDonor?: boolean,
): IconData | undefined {
    if (isDonor) {
        return DONOR_ICON;
    }

    switch (vDisk.FrontQueues) {
        case EFlag.Green:
        case EFlag.Blue:
            return undefined;
        case EFlag.Yellow:
            return Ellipsis;
        case EFlag.Orange:
            return GripHorizontal;
        case EFlag.Red:
            return Dots9;
        case EFlag.Grey:
        default:
            return CircleQuestionFill;
    }
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
export function calculateAllIcon(vDisk: PreparedVDisk, isDonor?: boolean): IconData | undefined {
    return calculateDefaultIcon(vDisk, isDonor);
}
