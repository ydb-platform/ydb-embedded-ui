import {
    ArrowsRotateLeft,
    CircleCheck,
    CircleXmark,
    Flame,
    Ghost,
    TriangleExclamation,
} from '@gravity-ui/icons';
import type {IconData, LabelProps} from '@gravity-ui/uikit';

export const STATUS_VISUAL_KEY = {
    Unspecified: 'unspecified',
    Good: 'good',
    Warning: 'warning',
    DangerCaution: 'danger-caution',
    DangerCritical: 'danger-critical',
    Replicated: 'replicated',
} as const;

export type StatusVisualKey = (typeof STATUS_VISUAL_KEY)[keyof typeof STATUS_VISUAL_KEY];

export interface StatusVisualConfig {
    theme: LabelProps['theme'];
    icon: IconData;
}

export const STATUS_VISUAL_CONFIG: Record<StatusVisualKey, StatusVisualConfig> = {
    [STATUS_VISUAL_KEY.Unspecified]: {
        theme: 'unknown',
        icon: Ghost,
    },
    [STATUS_VISUAL_KEY.Good]: {
        theme: 'success',
        icon: CircleCheck,
    },
    [STATUS_VISUAL_KEY.Warning]: {
        theme: 'warning',
        icon: TriangleExclamation,
    },
    [STATUS_VISUAL_KEY.DangerCaution]: {
        theme: 'danger',
        icon: Flame,
    },
    [STATUS_VISUAL_KEY.DangerCritical]: {
        theme: 'danger',
        icon: CircleXmark,
    },
    [STATUS_VISUAL_KEY.Replicated]: {
        theme: 'info',
        icon: ArrowsRotateLeft,
    },
};
