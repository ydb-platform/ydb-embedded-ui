import {CircleQuestionFill} from '@gravity-ui/icons';

import {DONOR_COLOR, NOT_AVAILABLE_SEVERITY} from './constants';
import type {DiskIndicatorValue} from './displayState';
import {getDisplaySeverityColor} from './helpers';
import type {DiskBarTone} from './types';

interface GetDiskBarToneParams {
    severity?: number;
    isDonor?: boolean;
    showIndicator?: boolean;
    indicator?: DiskIndicatorValue;
}

function hasMissingDataIndicator(indicator: DiskIndicatorValue | undefined) {
    if (Array.isArray(indicator)) {
        return indicator.some(({icon}) => icon === CircleQuestionFill);
    }

    return indicator === CircleQuestionFill;
}

export function getDiskBarTone({
    severity,
    isDonor,
    showIndicator,
    indicator,
}: GetDiskBarToneParams): DiskBarTone {
    if (isDonor) {
        return DONOR_COLOR;
    }

    if (
        showIndicator &&
        severity === NOT_AVAILABLE_SEVERITY &&
        hasMissingDataIndicator(indicator)
    ) {
        return 'LightGrey';
    }

    return getDisplaySeverityColor(severity);
}
