import {useState} from 'react';

import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {LoadingContainer} from '../../../../../components/LoadingContainer/LoadingContainer';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import {cpuDashboardConfig} from './cpuDashboardConfig';
import {TopNodesByLoad} from './TopNodesByLoad';
import {TopNodesByCpu} from './TopNodesByCpu';
import {TopShards} from './TopShards';
import {TopQueries} from './TopQueries';
import {b} from '../utils';

interface TenantCpuProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantCpu({path, additionalNodesProps}: TenantCpuProps) {
    const [dashboardLoading, setDashboardLoading] = useState<boolean>(true);

    return (
        <LoadingContainer loading={dashboardLoading} className={b('loading-container')}>
            <TenantDashboard
                charts={cpuDashboardConfig}
                onDashboardLoad={() => setDashboardLoading(false)}
            />
            <TopNodesByLoad path={path} additionalNodesProps={additionalNodesProps} />
            <TopNodesByCpu path={path} additionalNodesProps={additionalNodesProps} />
            <TopShards path={path} />
            <TopQueries path={path} />
        </LoadingContainer>
    );
}
