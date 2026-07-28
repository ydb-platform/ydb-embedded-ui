import {Flex} from '@gravity-ui/uikit';

import {SETTING_KEYS} from '../../../../../store/reducers/settings/constants';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {useSetting} from '../../../../../utils/hooks';
import {formatNetworkMetric} from '../../../../../utils/metrics/formatMetricLegend';
import {useDiagnosticsPageLinkGetter} from '../../DiagnosticsPages';
import {MetricPageSummary} from '../MetricPageSummary/MetricPageSummary';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';
import type {TenantOverviewMetric} from '../metricOverview';

import {TopNodesByPing} from './TopNodesByPing';
import {TopNodesBySkew} from './TopNodesBySkew';
import {networkDashboardConfig} from './networkDashboardConfig';

import './TenantNetwork.scss';

const b = cn('tenant-network');

interface TenantNetworkProps {
    database: string;
    metric?: TenantOverviewMetric;
    networkThroughput?: number;
}

function getNetworkThroughputText(networkThroughput?: number) {
    if (networkThroughput === undefined || !Number.isFinite(networkThroughput)) {
        return undefined;
    }

    return formatNetworkMetric(networkThroughput) || undefined;
}

export function TenantNetwork({database, metric, networkThroughput}: TenantNetworkProps) {
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();
    const [networkTableEnabled] = useSetting(SETTING_KEYS.ENABLE_NETWORK_TABLE);

    const allNodesLink = getDiagnosticsPageLink(
        networkTableEnabled
            ? TENANT_DIAGNOSTICS_TABS_IDS.network
            : TENANT_DIAGNOSTICS_TABS_IDS.nodes,
    );

    return (
        <Flex direction="column" gap={4} className={b()}>
            {metric ? (
                <MetricPageSummary
                    dataQa="tenant-page-metric-summary-network"
                    description={i18n('context_network-description')}
                    percentText={metric.percentText ?? EMPTY_DATA_PLACEHOLDER}
                    progressTheme={metric.progressTheme}
                    progressValue={metric.progressValue}
                    legend={getNetworkThroughputText(networkThroughput)}
                />
            ) : null}
            <TenantDashboard database={database} charts={networkDashboardConfig} />
            <StatsWrapper title={i18n('title_nodes-by-ping')} allEntitiesLink={allNodesLink}>
                <TopNodesByPing database={database} />
            </StatsWrapper>
            <StatsWrapper title={i18n('title_nodes-by-skew')} allEntitiesLink={allNodesLink}>
                <TopNodesBySkew database={database} />
            </StatsWrapper>
        </Flex>
    );
}
