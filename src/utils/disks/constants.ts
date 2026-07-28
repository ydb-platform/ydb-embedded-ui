import {
    ArrowsRotateLeft,
    BucketPaint,
    CircleCheck,
    CircleExclamation,
    CircleExclamationFill,
    TriangleExclamation,
} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';

import type {EFlag} from '../../types/api/enums';
import {TPDiskState} from '../../types/api/pdisk';
import {EVDiskState} from '../../types/api/vdisk';

import type {DataSeverity, DiskColor, DisplaySeverity} from './types';

/**
 * Named constants for DataSeverity levels (0-5).
 * Used for basic severity representation in PreparedVDisk.Severity and PreparedPDisk.Severity.
 */
export const DATA_SEVERITY = {
    GREY: 0 as DataSeverity,
    GREEN: 1 as DataSeverity,
    BLUE: 2 as DataSeverity,
    YELLOW: 3 as DataSeverity,
    ORANGE: 4 as DataSeverity,
    RED: 5 as DataSeverity,
} as const;

// state to numbers to allow ordinal comparison
export const DISK_COLOR_STATE_TO_NUMERIC_SEVERITY: Record<EFlag, DisplaySeverity> = {
    Grey: DATA_SEVERITY.GREY,
    Green: DATA_SEVERITY.GREEN,
    Blue: DATA_SEVERITY.BLUE,
    Yellow: DATA_SEVERITY.YELLOW,
    Orange: DATA_SEVERITY.ORANGE,
    Red: DATA_SEVERITY.RED,
};

// Additional severity level for State mode: solid red background for critical errors
export const SOLID_RED_SEVERITY: DisplaySeverity = 6;

// Space mode: detailed severity levels for each capacityAlert
export const SPACE_SEVERITY = {
    GREEN: 7 as DisplaySeverity,
    CYAN: 8 as DisplaySeverity,
    LIGHT_YELLOW: 9 as DisplaySeverity,
    YELLOW: 10 as DisplaySeverity,
    LIGHT_ORANGE: 11 as DisplaySeverity,
    PRE_ORANGE: 12 as DisplaySeverity,
    ORANGE: 13 as DisplaySeverity,
    RED: 14 as DisplaySeverity,
    BLACK: 15 as DisplaySeverity,
} as const;

// FrontQueues mode: detailed severity levels for queue status
export const FRONT_QUEUES_SEVERITY = {
    OK: 16 as DisplaySeverity, // Green - OK
    NOTICE: 17 as DisplaySeverity, // Yellow - Notice
    WARNING: 18 as DisplaySeverity, // Red - Warning
    IMPAIRED: 19 as DisplaySeverity, // SolidRed - Impaired
} as const;

// Compaction mode: severity levels based on Fresh/Level rank satisfaction
export const COMPACTION_SEVERITY = {
    OK: 20 as DisplaySeverity, // Green - both Fresh and Level are OK
    NOTICE: 21 as DisplaySeverity, // Yellow - at least one is Yellow
    WARNING: 22 as DisplaySeverity, // Red - at least one is Red
} as const;

export const DONOR_COLOR = 'DarkGrey';

type SeverityToColor = Record<number, DiskColor>;

function invertSeverityMap(map: Record<EFlag, number>): SeverityToColor {
    const result: SeverityToColor = {};
    let key: EFlag;
    for (key in map) {
        if (Object.prototype.hasOwnProperty.call(map, key)) {
            result[map[key]] = key;
        }
    }
    return result;
}

export const DISK_NUMERIC_SEVERITY_TO_STATE_COLOR: SeverityToColor = invertSeverityMap(
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
);

export const NOT_AVAILABLE_SEVERITY: DisplaySeverity = DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey;
export const NOT_AVAILABLE_SEVERITY_COLOR: DiskColor =
    DISK_NUMERIC_SEVERITY_TO_STATE_COLOR[NOT_AVAILABLE_SEVERITY];

export const ERROR_SEVERITY = DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red;

// Default mode: VDisk state severity mapping (used in combined severity calculation)
export const VDISK_STATE_SEVERITY: Record<EVDiskState, number> = {
    [EVDiskState.OK]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,

    [EVDiskState.Initial]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [EVDiskState.SyncGuidRecovery]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,

    [EVDiskState.LocalRecoveryError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [EVDiskState.SyncGuidRecoveryError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [EVDiskState.PDiskError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
};

// State mode: VDisk state severity mapping (used in State grouping mode)
export const VDISK_STATE_SEVERITY_FOR_STATE_MODE: Record<EVDiskState, DisplaySeverity> = {
    [EVDiskState.OK]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,

    // Initial states are Yellow in State mode
    [EVDiskState.Initial]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
    [EVDiskState.SyncGuidRecovery]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,

    // Error states use different severities in State mode
    [EVDiskState.LocalRecoveryError]: SOLID_RED_SEVERITY, // Solid red for critical errors
    [EVDiskState.SyncGuidRecoveryError]: SOLID_RED_SEVERITY, // Solid red for critical errors
    [EVDiskState.PDiskError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red, // Regular red for PDisk error
};

export const PDISK_STATE_SEVERITY = {
    [TPDiskState.Normal]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,

    [TPDiskState.Initial]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
    [TPDiskState.InitialFormatRead]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
    [TPDiskState.InitialSysLogRead]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
    [TPDiskState.InitialCommonLogRead]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,

    [TPDiskState.InitialFormatReadError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [TPDiskState.InitialSysLogReadError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [TPDiskState.InitialSysLogParseError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [TPDiskState.InitialCommonLogReadError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [TPDiskState.InitialCommonLogParseError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [TPDiskState.CommonLoggerInitError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [TPDiskState.OpenFileError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [TPDiskState.ChunkQuotaError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [TPDiskState.DeviceIoError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [TPDiskState.Stopped]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
};

export interface LabelVisualConfig {
    theme: LabelProps['theme'];
    icon?: IconData;
}

export const NUMERIC_SEVERITY_TO_LABEL_VIEW: Record<number, LabelVisualConfig> = {
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green]: {
        theme: 'success',
        icon: CircleCheck,
    },
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow]: {
        theme: 'warning',
        icon: TriangleExclamation,
    },
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red]: {
        theme: 'danger',
        icon: CircleExclamation,
    },
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue]: {
        theme: 'info',
        icon: ArrowsRotateLeft,
    },
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey]: {
        theme: 'normal',
    },
};

export const DONOR_ICON: IconData = BucketPaint;
export const DISPLAYED_DISK_ERROR_ICON: IconData = CircleExclamationFill;
export const DONOR_THEME: LabelProps['theme'] = 'unknown';

export const VDISK_LABEL_CONFIG: Record<string, LabelVisualConfig> = {
    donor: {
        theme: DONOR_THEME,
        icon: DONOR_ICON,
    },
    replica: {
        theme: NUMERIC_SEVERITY_TO_LABEL_VIEW[DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue].theme,
        icon: NUMERIC_SEVERITY_TO_LABEL_VIEW[DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue].icon,
    },
};
