import {SelfCheckResult} from '../../types/api/healthcheck';

import {STATUS_VISUAL_CONFIG, STATUS_VISUAL_KEY} from './common';
import type {StatusVisualConfig, StatusVisualKey} from './common';
import i18n from './i18n';

// Base statuses
export const SELF_CHECK_TO_VISUAL_KEY: Record<SelfCheckResult, StatusVisualKey> = {
    [SelfCheckResult.UNSPECIFIED]: STATUS_VISUAL_KEY.Unspecified,
    [SelfCheckResult.GOOD]: STATUS_VISUAL_KEY.Good,
    [SelfCheckResult.DEGRADED]: STATUS_VISUAL_KEY.Warning,
    [SelfCheckResult.MAINTENANCE_REQUIRED]: STATUS_VISUAL_KEY.DangerCaution,
    [SelfCheckResult.EMERGENCY]: STATUS_VISUAL_KEY.DangerCritical,
};

export const SELF_CHECK_TO_TEXT: Record<SelfCheckResult, string> = {
    get [SelfCheckResult.UNSPECIFIED]() {
        return i18n('title_unspecified');
    },
    get [SelfCheckResult.GOOD]() {
        return i18n('title_good');
    },
    get [SelfCheckResult.DEGRADED]() {
        return i18n('title_degraded');
    },
    get [SelfCheckResult.MAINTENANCE_REQUIRED]() {
        return i18n('title_maintenance');
    },
    get [SelfCheckResult.EMERGENCY]() {
        return i18n('title_emergency');
    },
};

export type SelfCheckView = StatusVisualConfig & {
    text: string;
};

export function getSelfCheckView(status: SelfCheckResult): SelfCheckView {
    const visualKey = SELF_CHECK_TO_VISUAL_KEY[status];
    const {theme, icon} = STATUS_VISUAL_CONFIG[visualKey];

    return {
        theme,
        icon,
        text: SELF_CHECK_TO_TEXT[status],
    };
}
