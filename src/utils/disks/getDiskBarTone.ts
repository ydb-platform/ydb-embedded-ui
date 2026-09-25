import {CircleQuestionFill} from '@gravity-ui/icons';

import {EFlag} from '../../types/api/enums';

import {DONOR_COLOR, NOT_AVAILABLE_SEVERITY} from './constants';
import type {DiskIndicatorValue} from './displayState';
import {getDisplaySeverityColor} from './helpers';
import type {DiskBarTone, PDiskType} from './types';

interface GetDiskBarToneParams {
    driveType?: PDiskType;
    severity?: number;
    isDonor?: boolean;
    showIndicator?: boolean;
    indicator?: DiskIndicatorValue;
    isNoData?: boolean;
}

function hasMissingDataIndicator(indicator: DiskIndicatorValue | undefined) {
    if (Array.isArray(indicator)) {
        return indicator.some(({icon}) => icon === CircleQuestionFill);
    }

    return indicator === CircleQuestionFill;
}

export function getDiskBarTone({
    driveType,
    severity,
    isDonor,
    showIndicator,
    indicator,
    isNoData,
}: GetDiskBarToneParams): DiskBarTone {
    if (driveType) {
        return driveType;
    }

    if (isDonor) {
        return DONOR_COLOR;
    }

    if (isNoData) {
        return EFlag.Grey;
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
