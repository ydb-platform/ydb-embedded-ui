import React from 'react';

import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';

import {TopNodesByCpu} from './TopNodesByCpu';
import {TopNodesByLoad} from './TopNodesByLoad';
import {TopQueries} from './TopQueries';
import {TopShards} from './TopShards';
import {cpuDashboardConfig} from './cpuDashboardConfig';

interface TenantCpuProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantCpu({tenantName, additionalNodesProps}: TenantCpuProps) {
    return (
        <React.Fragment>
            <TenantDashboard database={tenantName} charts={cpuDashboardConfig} />
            <TopNodesByLoad tenantName={tenantName} additionalNodesProps={additionalNodesProps} />
            <TopNodesByCpu tenantName={tenantName} additionalNodesProps={additionalNodesProps} />
            <TopShards tenantName={tenantName} path={tenantName} />
            <TopQueries tenantName={tenantName} />
        </React.Fragment>
    );
}
