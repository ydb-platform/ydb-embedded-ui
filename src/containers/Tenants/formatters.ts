import type React from 'react';

import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';

/** Shows an explicitly reported zero, the placeholder is for missing values only */
export function renderOptionalNumber(value: unknown, format: (value: number) => React.ReactNode) {
    const parsed = parseOptionalNonNegativeNumber(value);
    return parsed === undefined ? EMPTY_DATA_PLACEHOLDER : format(parsed);
}
