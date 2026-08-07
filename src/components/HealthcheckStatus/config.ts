import {CircleCheck, CircleXmark, Flame, Ghost, TriangleExclamation} from '@gravity-ui/icons';
import type {AlertProps, IconData, LabelProps} from '@gravity-ui/uikit';

import {SelfCheckResult} from '../../types/api/healthcheck';

import i18n from './i18n';

interface SelfCheckResultConfig {
    alertTheme: NonNullable<AlertProps['theme']>;
    emergency: boolean;
    icon: IconData;
    labelTheme: NonNullable<LabelProps['theme']>;
    title: string;
    tooltip: string;
}

export const SELF_CHECK_RESULT_CONFIG: Record<SelfCheckResult, SelfCheckResultConfig> = {
    [SelfCheckResult.UNSPECIFIED]: {
        alertTheme: 'normal',
        emergency: false,
        icon: Ghost,
        labelTheme: 'unknown',
        get title() {
            return i18n('title_unspecified');
        },
        get tooltip() {
            return i18n('context_unspecified');
        },
    },
    [SelfCheckResult.GOOD]: {
        alertTheme: 'success',
        emergency: false,
        icon: CircleCheck,
        labelTheme: 'success',
        get title() {
            return i18n('title_good');
        },
        get tooltip() {
            return i18n('context_good');
        },
    },
    [SelfCheckResult.DEGRADED]: {
        alertTheme: 'warning',
        emergency: false,
        icon: TriangleExclamation,
        labelTheme: 'warning',
        get title() {
            return i18n('title_degraded');
        },
        get tooltip() {
            return i18n('context_degraded');
        },
    },
    [SelfCheckResult.MAINTENANCE_REQUIRED]: {
        alertTheme: 'danger',
        emergency: false,
        icon: Flame,
        labelTheme: 'danger',
        get title() {
            return i18n('title_maintenance');
        },
        get tooltip() {
            return i18n('context_maintenance');
        },
    },
    [SelfCheckResult.EMERGENCY]: {
        alertTheme: 'danger',
        emergency: true,
        icon: CircleXmark,
        labelTheme: 'danger',
        get title() {
            return i18n('title_emergency');
        },
        get tooltip() {
            return i18n('context_emergency');
        },
    },
};
