import {InfoViewer} from '../../../../../components/InfoViewer/InfoViewer';
import {ProgressWrapper} from '../../../../../components/ProgressWrapper';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TMemoryStats} from '../../../../../types/api/nodes';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatStorageValuesToGb} from '../../../../../utils/dataFormatters/dataFormatters';
import {useDiagnosticsPageLinkGetter} from '../../DiagnosticsPages';
import {MetricPageSummary} from '../MetricPageSummary/MetricPageSummary';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';
import type {TenantOverviewUsageMetric} from '../metricOverview';

import {MemoryDetailsSection} from './MemoryDetailsSection';
import {TopNodesByMemory} from './TopNodesByMemory';
import {memoryDashboardConfig} from './memoryDashboardConfig';

import './TenantMemory.scss';

interface TenantMemoryProps {
    database: string;
    memoryStats?: TMemoryStats;
    memoryUsed?: string;
    memoryLimit?: string;
    metric?: TenantOverviewUsageMetric;
}

const b = cn('tenant-memory');

export function TenantMemory({
    database,
    memoryStats,
    memoryUsed,
    memoryLimit,
    metric,
}: TenantMemoryProps) {
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();
    const renderMemoryDetails = () => {
        if (memoryStats) {
            return <MemoryDetailsSection memoryStats={memoryStats} />;
        }

        // Simple fallback view
        return (
            <InfoViewer
                variant="small"
                title={i18n('title_memory-details')}
                info={[
                    {
                        label: i18n('field_memory-usage'),
                        value: (
                            <ProgressWrapper
                                value={memoryUsed}
                                capacity={memoryLimit}
                                formatValues={formatStorageValuesToGb}
                                withCapacityUsage
                                className={b('fallback-progress-wrapper')}
                                size="m"
                                width={400}
                            />
                        ),
                    },
                ]}
            />
        );
    };

    return (
        <div className={b()}>
            {metric ? (
                <MetricPageSummary
                    className={b('metric-summary')}
                    dataQa="tenant-page-metric-summary-memory"
                    description={i18n('context_memory-description')}
                    percentText={metric.percentText ?? EMPTY_DATA_PLACEHOLDER}
                    progressTheme={metric.progressTheme}
                    progressValue={metric.progressValue}
                    legend={metric.legend}
                />
            ) : null}
            <TenantDashboard database={database} charts={memoryDashboardConfig} />
            {renderMemoryDetails()}

            <StatsWrapper
                title={i18n('title_top-nodes-by-memory')}
                allEntitiesLink={getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.nodes)}
            >
                <TopNodesByMemory database={database} />
            </StatsWrapper>
        </div>
    );
}
