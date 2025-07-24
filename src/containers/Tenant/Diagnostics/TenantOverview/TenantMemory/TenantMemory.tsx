import {InfoViewer} from '../../../../../components/InfoViewer/InfoViewer';
import type {TMemoryStats} from '../../../../../types/api/nodes';
import {cn} from '../../../../../utils/cn';
import {formatStorageValuesToGb} from '../../../../../utils/dataFormatters/dataFormatters';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

import {MemoryDetailsSection} from './MemoryDetailsSection';
import {MemoryProgressBar} from './MemoryProgressBar';
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
                            <div>
                                <MemoryProgressBar
                                    memoryUsed={memoryUsed}
                                    memoryLimit={memoryLimit}
                                />
                                <div className={b('value-text')} style={{marginTop: '8px'}}>
                                    {formatStorageValuesToGb(Number(memoryUsed))[0]} of{' '}
                                    {formatStorageValuesToGb(Number(memoryLimit))[0]}
                                </div>
                            </div>
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
