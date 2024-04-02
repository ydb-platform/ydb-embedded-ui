import React from 'react';

import {TenantDashboard} from '../TenantDashboard/TenantDashboard';

import {TopNodesByMemory} from './TopNodesByMemory';
import {memoryDashboardConfig} from './memoryDashboardConfig';

interface TenantMemoryProps {
    path: string;
}

export function TenantMemory({path}: TenantMemoryProps) {
    return (
        <React.Fragment>
            <TenantDashboard database={path} charts={memoryDashboardConfig} />
            <TopNodesByMemory path={path} />
        </React.Fragment>
    );
}
