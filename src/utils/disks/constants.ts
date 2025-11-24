import {
    ArrowsRotateLeft,
    BucketPaint,
    CircleCheck,
    CircleExclamation,
    TriangleExclamation,
} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';

import type {EFlag} from '../../types/api/enums';
import {TPDiskState} from '../../types/api/pdisk';
import {EVDiskState} from '../../types/api/vdisk';

// state to numbers to allow ordinal comparison
export const DISK_COLOR_STATE_TO_NUMERIC_SEVERITY: Record<EFlag, number> = {
    Grey: 0,
    Green: 1,
    Blue: 2,
    Yellow: 3,
    Orange: 4,
    Red: 5,
} as const;

export const DONOR_COLOR = 'DarkGrey';

type SeverityToColor = Record<number, keyof typeof DISK_COLOR_STATE_TO_NUMERIC_SEVERITY>;

export const DISK_NUMERIC_SEVERITY_TO_STATE_COLOR = Object.entries(
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
).reduce<SeverityToColor>((acc, [color, severity]) => ({...acc, [severity]: color as EFlag}), {});

export const NOT_AVAILABLE_SEVERITY = DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey;
export const NOT_AVAILABLE_SEVERITY_COLOR =
    DISK_NUMERIC_SEVERITY_TO_STATE_COLOR[NOT_AVAILABLE_SEVERITY];

export const VDISK_STATE_SEVERITY: Record<EVDiskState, number> = {
    [EVDiskState.OK]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,

    [EVDiskState.Initial]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
    [EVDiskState.SyncGuidRecovery]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,

    [EVDiskState.LocalRecoveryError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [EVDiskState.SyncGuidRecoveryError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
    [EVDiskState.PDiskError]: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
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
    icon: IconData;
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
};

export const DONOR_ICON: IconData = BucketPaint;
export const DISPLAYED_DISK_ERROR_ICON: IconData =
    NUMERIC_SEVERITY_TO_LABEL_VIEW[DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red].icon;
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
