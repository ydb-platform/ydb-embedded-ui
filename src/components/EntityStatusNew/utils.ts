import {EFlag} from '../../types/api/enums';

import i18n from './i18n';

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
    get [EFlag.DarkGrey]() {
        return i18n('context_grey');
    },
    get [EFlag.Blue]() {
        return i18n('context_blue');
    },
};
