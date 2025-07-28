import {InfoViewer} from '../../../../../components/InfoViewer/InfoViewer';
import {ProgressWrapper} from '../../../../../components/ProgressWrapper';
import type {TMemoryStats} from '../../../../../types/api/nodes';
import {cn} from '../../../../../utils/cn';
import {formatStorageValuesToGb} from '../../../../../utils/dataFormatters/dataFormatters';
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
                                size="m"
                                width="full"
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
            <TopNodesByMemory tenantName={tenantName} />
        </div>
    );
}
