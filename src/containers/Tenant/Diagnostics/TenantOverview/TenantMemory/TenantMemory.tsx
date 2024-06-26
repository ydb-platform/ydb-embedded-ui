import React from 'react';

import {TenantDashboard} from '../TenantDashboard/TenantDashboard';

import {TopNodesByMemory} from './TopNodesByMemory';
import {memoryDashboardConfig} from './memoryDashboardConfig';

interface TenantMemoryProps {
    tenantName: string;
}

export function TenantMemory({tenantName}: TenantMemoryProps) {
    return (
        <React.Fragment>
            <TenantDashboard database={tenantName} charts={memoryDashboardConfig} />
            <TopNodesByMemory tenantName={tenantName} />
        </React.Fragment>
    );
}
