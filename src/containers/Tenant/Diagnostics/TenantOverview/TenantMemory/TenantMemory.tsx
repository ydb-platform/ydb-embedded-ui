import React from 'react';

import {MemoryViewer} from '../../../../../components/MemoryViewer/MemoryViewer';
import {ProgressViewer} from '../../../../../components/ProgressViewer/ProgressViewer';
import type {TMemoryStats} from '../../../../../types/api/nodes';
import {formatStorageValuesToGb} from '../../../../../utils/dataFormatters/dataFormatters';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import {b} from '../utils';

import {TopNodesByMemory} from './TopNodesByMemory';
import {memoryDashboardConfig} from './memoryDashboardConfig';

interface TenantMemoryProps {
    tenantName: string;
    memoryStats?: TMemoryStats;
    memoryUsed?: string;
    memoryLimit?: string;
}

export function TenantMemory({
    tenantName,
    memoryStats,
    memoryUsed,
    memoryLimit,
}: TenantMemoryProps) {
    return (
        <React.Fragment>
            <TenantDashboard database={tenantName} charts={memoryDashboardConfig} />
            <div className={b('title')}>{'Memory details'}</div>
            <div className={b('memory-info')}>
                {memoryStats ? (
                    <MemoryViewer formatValues={formatStorageValuesToGb} stats={memoryStats} />
                ) : (
                    <ProgressViewer
                        value={memoryUsed}
                        capacity={memoryLimit}
                        formatValues={formatStorageValuesToGb}
                        colorizeProgress={true}
                    />
                )}
            </div>
            <TopNodesByMemory tenantName={tenantName} />
        </React.Fragment>
    );
}
