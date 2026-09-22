import type {LabelProps} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';

import i18n from './i18n';

export const EFlagToLabelTheme: Record<EFlag, LabelProps['theme']> = {
    [EFlag.Red]: 'danger',
    [EFlag.Blue]: 'success',
    [EFlag.Green]: 'success',
    [EFlag.Grey]: 'unknown',
    [EFlag.Orange]: 'danger',
    [EFlag.Yellow]: 'warning',
};

export const EFlagToDescription: Record<EFlag, string> = {
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
