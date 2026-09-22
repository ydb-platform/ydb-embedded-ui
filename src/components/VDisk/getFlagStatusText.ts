import {EFlag} from '../../types/api/enums';

import {i18n} from './i18n';

export function getFlagStatusText(flag: EFlag | undefined) {
    switch (flag) {
        case EFlag.Green:
        case EFlag.Blue:
            return i18n('value_ok');
        case EFlag.Yellow:
            return i18n('value_notice');
        case EFlag.Orange:
            return i18n('value_warning');
        case EFlag.Red:
            return i18n('value_impaired');
        default:
            return i18n('context_no-data');
    }
}
