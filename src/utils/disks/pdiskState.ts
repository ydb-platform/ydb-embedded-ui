import {
    ArrowUpFromLine,
    Ban,
    CircleExclamation,
    CircleExclamationFill,
    CircleQuestionFill,
    CircleStopFill,
    CircleXmark,
    CircleXmarkFill,
    Clock,
    ClockFill,
    HourglassStart,
    TrashBin,
    Wrench,
    Xmark,
} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';

import type {
    EDecommitStatus,
    EDriveStatus,
    EMaintenanceStatus,
    TPDiskState,
} from '../../types/api/pdisk';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    NOT_AVAILABLE_SEVERITY,
    SOLID_RED_SEVERITY,
} from './constants';
import type {BaseDiskDisplayState} from './displayState';

type PDiskStateDisplayState = {
    severity: BaseDiskDisplayState['severity'];
    icon: IconData | undefined;
};

const NOT_AVAILABLE_DISPLAY_STATE: PDiskStateDisplayState = {
    severity: NOT_AVAILABLE_SEVERITY,
    icon: undefined,
};

const PDISK_STATE_DISPLAY_STATE: Record<TPDiskState, PDiskStateDisplayState> = {
    Normal: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
        icon: undefined,
    },
    Initial: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        icon: ClockFill,
    },
    InitialFormatRead: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        icon: ClockFill,
    },
    InitialSysLogRead: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        icon: ClockFill,
    },
    InitialCommonLogRead: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        icon: ClockFill,
    },
    OpenFileError: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
        icon: CircleExclamationFill,
    },
    DeviceIoError: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
        icon: CircleExclamationFill,
    },
    Stopped: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
        icon: CircleStopFill,
    },
    InitialFormatReadError: {
        severity: SOLID_RED_SEVERITY,
        icon: CircleXmarkFill,
    },
    InitialSysLogReadError: {
        severity: SOLID_RED_SEVERITY,
        icon: CircleXmarkFill,
    },
    InitialSysLogParseError: {
        severity: SOLID_RED_SEVERITY,
        icon: CircleXmarkFill,
    },
    InitialCommonLogReadError: {
        severity: SOLID_RED_SEVERITY,
        icon: CircleXmarkFill,
    },
    InitialCommonLogParseError: {
        severity: SOLID_RED_SEVERITY,
        icon: CircleXmarkFill,
    },
    CommonLoggerInitError: {
        severity: SOLID_RED_SEVERITY,
        icon: CircleXmarkFill,
    },
    ChunkQuotaError: {
        severity: SOLID_RED_SEVERITY,
        icon: CircleXmarkFill,
    },
    Missing: NOT_AVAILABLE_DISPLAY_STATE,
    Timeout: NOT_AVAILABLE_DISPLAY_STATE,
    NodeDisconnected: NOT_AVAILABLE_DISPLAY_STATE,
    Unknown: NOT_AVAILABLE_DISPLAY_STATE,
};

export function getPDiskStateDisplayState(state?: TPDiskState): PDiskStateDisplayState {
    return isPDiskStateDisplayState(state)
        ? PDISK_STATE_DISPLAY_STATE[state]
        : NOT_AVAILABLE_DISPLAY_STATE;
}

const PDISK_DRIVE_DISPLAY_STATE: Record<EDriveStatus, PDiskStateDisplayState> = {
    ACTIVE: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
        icon: undefined,
    },
    INACTIVE: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        icon: Clock,
    },
    TO_BE_REMOVED: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        icon: TrashBin,
    },
    FAULTY: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
        icon: CircleExclamation,
    },
    BROKEN: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
        icon: CircleXmark,
    },
    UNKNOWN: {
        severity: NOT_AVAILABLE_SEVERITY,
        icon: CircleQuestionFill,
    },
};

export function getPDiskDriveDisplayState(status?: EDriveStatus): PDiskStateDisplayState {
    if (status === undefined || PDISK_DRIVE_DISPLAY_STATE[status] === undefined) {
        return NOT_AVAILABLE_DISPLAY_STATE;
    }
    return PDISK_DRIVE_DISPLAY_STATE[status];
}

const PDISK_DECOMMIT_DISPLAY_STATE: Record<EDecommitStatus, PDiskStateDisplayState> = {
    DECOMMIT_UNSET: {
        severity: NOT_AVAILABLE_SEVERITY,
        icon: CircleQuestionFill,
    },
    DECOMMIT_NONE: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
        icon: undefined,
    },
    DECOMMIT_PENDING: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue,
        icon: HourglassStart,
    },
    DECOMMIT_IMMINENT: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
        icon: ArrowUpFromLine,
    },
    DECOMMIT_REJECTED: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        icon: Xmark,
    },
};

export function getPDiskDecommitDisplayState(status?: EDecommitStatus): PDiskStateDisplayState {
    return status === undefined
        ? NOT_AVAILABLE_DISPLAY_STATE
        : (PDISK_DECOMMIT_DISPLAY_STATE[status] ?? NOT_AVAILABLE_DISPLAY_STATE);
}

const PDISK_MAINTENANCE_DISPLAY_STATE: Record<EMaintenanceStatus, PDiskStateDisplayState> = {
    NOT_SET: {
        severity: NOT_AVAILABLE_SEVERITY,
        icon: CircleQuestionFill,
    },
    NO_REQUEST: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
        icon: undefined,
    },
    LONG_TERM_MAINTENANCE_PLANNED: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
        icon: Wrench,
    },
    NO_NEW_VDISKS: {
        severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        icon: Ban,
    },
};

export function getPDiskMaintenanceDisplayState(
    status?: EMaintenanceStatus,
): PDiskStateDisplayState {
    return status === undefined
        ? NOT_AVAILABLE_DISPLAY_STATE
        : (PDISK_MAINTENANCE_DISPLAY_STATE[status] ?? NOT_AVAILABLE_DISPLAY_STATE);
}

function isPDiskStateDisplayState(
    state?: TPDiskState,
): state is keyof typeof PDISK_STATE_DISPLAY_STATE {
    return state !== undefined && Object.hasOwn(PDISK_STATE_DISPLAY_STATE, state);
}
