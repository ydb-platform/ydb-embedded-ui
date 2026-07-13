import {Flex} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {getTenantPath, parseQuery} from '../../../../../routes';
import {SETTING_KEYS} from '../../../../../store/reducers/settings/constants';
import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import {cn} from '../../../../../utils/cn';
import {useSetting} from '../../../../../utils/hooks';
import {TenantTabsGroups} from '../../../TenantPages';
import type {TenantOverviewMetrics} from '../metricOverview';

import {CpuTab} from './components/CpuTab';
import {MemoryTab} from './components/MemoryTab';
import {NetworkTab} from './components/NetworkTab';
import {PlaceholderTab} from './components/PlaceholderTab';
import {StorageTab} from './components/StorageTab';

import './MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface MetricsTabsProps {
    activeTab: TenantMetricsTab;
    isServerless: boolean;
    metrics: TenantOverviewMetrics;
}

export function MetricsTabs({
    activeTab,
    isServerless,
    metrics: {network, cpu, storage, memory},
}: MetricsTabsProps) {
    const location = useLocation();
    const queryParams = parseQuery(location);

    const tabLinks: Record<TenantMetricsTab, string> = {
        [TENANT_METRICS_TABS_IDS.cpu]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.cpu,
        }),
        [TENANT_METRICS_TABS_IDS.storage]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.storage,
        }),
        [TENANT_METRICS_TABS_IDS.memory]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.memory,
        }),
        [TENANT_METRICS_TABS_IDS.network]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.network,
        }),
    };

    const [showNetworkUtilization] = useSetting<boolean>(SETTING_KEYS.SHOW_NETWORK_UTILIZATION);

    // card variant is handled within subcomponents

    const renderNetworkTab = () => {
        if (isServerless || !showNetworkUtilization || !network) {
            return null;
        }

        return (
            <NetworkTab
                to={tabLinks[TENANT_METRICS_TABS_IDS.network]}
                active={activeTab === TENANT_METRICS_TABS_IDS.network}
                network={network}
            />
        );
    };

    const renderMemoryTab = () => {
        if (isServerless || !memory) {
            return null;
        }

        return (
            <MemoryTab
                to={tabLinks[TENANT_METRICS_TABS_IDS.memory]}
                active={activeTab === TENANT_METRICS_TABS_IDS.memory}
                memory={memory}
            />
        );
    };

    return (
        <Flex className={b({serverless: isServerless})} alignItems="start">
            <CpuTab
                to={tabLinks[TENANT_METRICS_TABS_IDS.cpu]}
                active={activeTab === TENANT_METRICS_TABS_IDS.cpu}
                cpu={cpu}
                isServerless={isServerless}
            />
            <StorageTab
                to={tabLinks[TENANT_METRICS_TABS_IDS.storage]}
                active={activeTab === TENANT_METRICS_TABS_IDS.storage}
                storage={storage}
                isServerless={isServerless}
            />
            {renderMemoryTab()}
            {renderNetworkTab()}
            <PlaceholderTab />
        </Flex>
    );
}
