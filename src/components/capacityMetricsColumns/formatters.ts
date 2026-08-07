import {formatMetricCount} from '../../utils/storageMetrics';

import i18n from './i18n';

export function formatCapacityUnitCount(value?: unknown) {
    if (value === undefined || value === 0) {
        return i18n('value_implicit-unit-count');
    }

    return formatMetricCount(value);
}
