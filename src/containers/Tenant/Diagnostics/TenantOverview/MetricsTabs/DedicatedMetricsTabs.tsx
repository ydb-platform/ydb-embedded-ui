import {Link} from 'react-router-dom';

import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import {formatBytes} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';
import {formatStorageLegend} from '../../../../../utils/metrics/formatMetricLegend';
import type {MetricFormatParams} from '../../../../../utils/metrics/formatMetricLegend';
import {TabCard} from '../TabCard/TabCard';
import i18n from '../i18n';

const b = cn('tenant-metrics-tabs');

// Format network throughput to match cluster display (just the throughput value, not "X of Y")
function formatNetworkThroughputLegend({value}: MetricFormatParams): string {
    return formatBytes({value, withSpeedLabel: true});
}

interface DedicatedMetricsTabsProps {
    activeTab: TenantMetricsTab;
    tabLinks: Record<TenantMetricsTab, string>;
    memory: {totalUsed: number; totalLimit: number};
    network: {totalUsed: number; totalLimit: number} | null;
    showNetwork: boolean;
}

export function DedicatedMetricsTabs({
    activeTab,
    tabLinks,
    memory,
    network,
    showNetwork,
}: DedicatedMetricsTabsProps) {
    return (
        <>
            <div
                className={b('link-container', {
                    active: activeTab === TENANT_METRICS_TABS_IDS.memory,
                })}
            >
                <Link to={tabLinks.memory} className={b('link')}>
                    <TabCard
                        text={i18n('context_memory-used')}
                        value={memory.totalUsed}
                        limit={memory.totalLimit}
                        legendFormatter={formatStorageLegend}
                        active={activeTab === TENANT_METRICS_TABS_IDS.memory}
                        helpText={i18n('context_memory-description')}
                        databaseType="Dedicated"
                    />
                </Link>
            </div>
            {showNetwork && network && (
                <div
                    className={b('link-container', {
                        active: activeTab === TENANT_METRICS_TABS_IDS.network,
                    })}
                >
                    <Link to={tabLinks.network} className={b('link')}>
                        <TabCard
                            text={i18n('context_network-usage')}
                            value={network.totalUsed}
                            limit={network.totalLimit}
                            legendFormatter={formatNetworkThroughputLegend}
                            active={activeTab === TENANT_METRICS_TABS_IDS.network}
                            helpText={i18n('context_network-description')}
                            databaseType="Dedicated"
                        />
                    </Link>
                </div>
            )}
        </>
    );
}
