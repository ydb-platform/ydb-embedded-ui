import {CircleExclamationFill, CircleStopFill, CircleXmarkFill, ClockFill} from '@gravity-ui/icons';

import type {TPDiskState} from '../../types/api/pdisk';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    NOT_AVAILABLE_SEVERITY,
    SOLID_RED_SEVERITY,
} from './constants';
import type {DiskDisplayState} from './displayState';

type PDiskStateDisplayState = Pick<DiskDisplayState, 'severity' | 'icon'>;

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

function isPDiskStateDisplayState(
    state?: TPDiskState,
): state is keyof typeof PDISK_STATE_DISPLAY_STATE {
    return state !== undefined && Object.hasOwn(PDISK_STATE_DISPLAY_STATE, state);
}
