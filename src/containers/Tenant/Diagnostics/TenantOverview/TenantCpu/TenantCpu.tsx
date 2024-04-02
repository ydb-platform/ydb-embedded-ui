import React from 'react';

import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';

import {TopNodesByCpu} from './TopNodesByCpu';
import {TopNodesByLoad} from './TopNodesByLoad';
import {TopQueries} from './TopQueries';
import {TopShards} from './TopShards';
import {cpuDashboardConfig} from './cpuDashboardConfig';

interface TenantCpuProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantCpu({path, additionalNodesProps}: TenantCpuProps) {
    return (
        <React.Fragment>
            <TenantDashboard database={path} charts={cpuDashboardConfig} />
            <TopNodesByLoad path={path} additionalNodesProps={additionalNodesProps} />
            <TopNodesByCpu path={path} additionalNodesProps={additionalNodesProps} />
            <TopShards path={path} />
            <TopQueries path={path} />
        </React.Fragment>
    );
}
