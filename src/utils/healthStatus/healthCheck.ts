import {EFlag} from '../../types/api/enums';

import {STATUS_VISUAL_CONFIG, STATUS_VISUAL_KEY} from './common';
import type {StatusVisualConfig, StatusVisualKey} from './common';
import i18n from './i18n';

// Healthcheck statuses
export const EFLAG_TO_VISUAL_KEY: Record<EFlag, StatusVisualKey> = {
    [EFlag.Grey]: STATUS_VISUAL_KEY.Unspecified,
    [EFlag.Green]: STATUS_VISUAL_KEY.Good,
    [EFlag.Yellow]: STATUS_VISUAL_KEY.Warning,
    [EFlag.Orange]: STATUS_VISUAL_KEY.DangerCaution,
    [EFlag.Red]: STATUS_VISUAL_KEY.DangerCritical,
    [EFlag.Blue]: STATUS_VISUAL_KEY.Replicated,
};

export const EFLAG_TO_TITLE: Record<EFlag, string> = {
    get [EFlag.Red]() {
        return i18n('title_red');
    },
    get [EFlag.Yellow]() {
        return i18n('title_yellow');
    },
    get [EFlag.Orange]() {
        return i18n('title_orange');
    },
    get [EFlag.Green]() {
        return i18n('title_green');
    },
    get [EFlag.Grey]() {
        return i18n('title_grey');
    },
    get [EFlag.Blue]() {
        return i18n('title_blue');
    },
};

export const EFLAG_TO_DESCRIPTION: Record<EFlag, string> = {
    get [EFlag.Red]() {
        return i18n('context_red');
    },
    get [EFlag.Yellow]() {
        return i18n('context_yellow');
    },
    get [EFlag.Orange]() {
        return i18n('context_orange');
    },
    get [EFlag.Green]() {
        return i18n('context_green');
    },
    get [EFlag.Grey]() {
        return i18n('context_grey');
    },
    get [EFlag.Blue]() {
        return i18n('context_blue');
    },
};

export type EFlagView = StatusVisualConfig & {
    title: string;
    description: string;
};

export function getEFlagView(flag: EFlag): EFlagView {
    const visualKey = EFLAG_TO_VISUAL_KEY[flag];
    const {theme, icon} = STATUS_VISUAL_CONFIG[visualKey];

    return {
        theme,
        icon,
        title: EFLAG_TO_TITLE[flag],
        description: EFLAG_TO_DESCRIPTION[flag],
    };
}
