import {InfoViewer} from '../../../../../components/InfoViewer/InfoViewer';
import {ProgressWrapper} from '../../../../../components/ProgressWrapper';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TMemoryStats} from '../../../../../types/api/nodes';
import {cn} from '../../../../../utils/cn';
import {formatStorageValuesToGb} from '../../../../../utils/dataFormatters/dataFormatters';
import {useSearchQuery} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

import {MemoryDetailsSection} from './MemoryDetailsSection';
import {TopNodesByMemory} from './TopNodesByMemory';
import {memoryDashboardConfig} from './memoryDashboardConfig';

import './TenantMemory.scss';

interface TenantMemoryProps {
    tenantName: string;
    memoryStats?: TMemoryStats;
    memoryUsed?: string;
    memoryLimit?: string;
}

const b = cn('tenant-memory');

export function TenantMemory({
    tenantName,
    memoryStats,
    memoryUsed,
    memoryLimit,
}: TenantMemoryProps) {
    const query = useSearchQuery();
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
            <TenantDashboard database={tenantName} charts={memoryDashboardConfig} />
            {renderMemoryDetails()}

            <StatsWrapper
                title={i18n('title_top-nodes-by-memory')}
                allEntitiesLink={getTenantPath({
                    ...query,
                    [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.nodes,
                })}
            >
                <TopNodesByMemory tenantName={tenantName} />
            </StatsWrapper>
        </div>
    );
}
