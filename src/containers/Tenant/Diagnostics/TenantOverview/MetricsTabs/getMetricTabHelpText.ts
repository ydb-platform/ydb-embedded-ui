import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import {EFlag} from '../../../../../types/api/enums';
import i18n from '../i18n';

type AvailableMetricStatus = EFlag.Green | EFlag.Yellow | EFlag.Red;

const metricHelpTextGetters: Record<
    TenantMetricsTab,
    Record<AvailableMetricStatus, () => string>
> = {
    [TENANT_METRICS_TABS_IDS.cpu]: {
        [EFlag.Green]: () => i18n('context_cpu-status-normal'),
        [EFlag.Yellow]: () => i18n('context_cpu-status-warning'),
        [EFlag.Red]: () => i18n('context_cpu-status-critical'),
    },
    [TENANT_METRICS_TABS_IDS.storage]: {
        [EFlag.Green]: () => i18n('context_storage-status-normal'),
        [EFlag.Yellow]: () => i18n('context_storage-status-warning'),
        [EFlag.Red]: () => i18n('context_storage-status-critical'),
    },
    [TENANT_METRICS_TABS_IDS.memory]: {
        [EFlag.Green]: () => i18n('context_memory-status-normal'),
        [EFlag.Yellow]: () => i18n('context_memory-status-warning'),
        [EFlag.Red]: () => i18n('context_memory-status-critical'),
    },
    [TENANT_METRICS_TABS_IDS.network]: {
        [EFlag.Green]: () => i18n('context_network-status-normal'),
        [EFlag.Yellow]: () => i18n('context_network-status-warning'),
        [EFlag.Red]: () => i18n('context_network-status-critical'),
    },
};

function isAvailableMetricStatus(status: EFlag): status is AvailableMetricStatus {
    return status === EFlag.Green || status === EFlag.Yellow || status === EFlag.Red;
}

export function getMetricTabHelpText(metric: TenantMetricsTab, status: EFlag) {
    if (status === EFlag.Grey) {
        return i18n('context_metric-status-unavailable');
    }

    if (!isAvailableMetricStatus(status)) {
        return undefined;
    }

    return metricHelpTextGetters[metric][status]();
}
