import {InfoViewer} from '../../../../../components/InfoViewer/InfoViewer';
import {ProgressWrapper} from '../../../../../components/ProgressWrapper';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TMemoryStats} from '../../../../../types/api/nodes';
import {cn} from '../../../../../utils/cn';
import {formatStorageValuesToGb} from '../../../../../utils/dataFormatters/dataFormatters';
import {useDiagnosticsPageLinkGetter} from '../../DiagnosticsPages';
import {MetricPageSummary} from '../MetricPageSummary/MetricPageSummary';
import type {MetricPageSummaryData} from '../MetricPageSummary/MetricPageSummary';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

import {MemoryDetailsSection} from './MemoryDetailsSection';
import {TopNodesByMemory} from './TopNodesByMemory';
import {memoryDashboardConfig} from './memoryDashboardConfig';

import './TenantMemory.scss';

interface TenantMemoryProps {
    database: string;
    memoryStats?: TMemoryStats;
    memoryUsed?: string;
    memoryLimit?: string;
    metricSummary?: MetricPageSummaryData;
}

const b = cn('tenant-memory');

export function TenantMemory({
    database,
    memoryStats,
    memoryUsed,
    memoryLimit,
    metricSummary,
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
            {metricSummary ? (
                <MetricPageSummary
                    className={b('metric-summary')}
                    dataQa="tenant-page-metric-summary-memory"
                    {...metricSummary}
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
